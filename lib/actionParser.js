/**
 * Parses AI response to extract actionable Playwright commands
 * @param {string} aiResponse - AI response text
 * @returns {Array} - array of parsed actions
 */
function parseActions(aiResponse) {
  const actions = [];
  
  try {
    // Patterns to match Playwright actions in AI response
    const patterns = {
      click: [
        /page\.click\(['"`]([^'"`]+)['"`]\)/gi,
        /page\.locator\(['"`]([^'"`]+)['"`]\)\.click\(\)/gi,
        /page\.getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{[^}]*name:\s*['"`]([^'"`]+)['"`][^}]*\})?\)\.click\(\)/gi,
        /page\.getByText\(['"`]([^'"`]+)['"`]\)\.click\(\)/gi,
        /page\.getByTestId\(['"`]([^'"`]+)['"`]\)\.click\(\)/gi,
        /\.click\(['"`]([^'"`]+)['"`]\)/gi
      ],
      fill: [
        /page\.fill\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`]\)/gi,
        /page\.locator\(['"`]([^'"`]+)['"`]\)\.fill\(['"`]([^'"`]+)['"`]\)/gi,
        /page\.getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{[^}]*name:\s*['"`]([^'"`]+)['"`][^}]*\})?\)\.fill\(['"`]([^'"`]+)['"`]\)/gi,
        /page\.getByPlaceholder\(['"`]([^'"`]+)['"`]\)\.fill\(['"`]([^'"`]+)['"`]\)/gi,
        /page\.getByLabel\(['"`]([^'"`]+)['"`]\)\.fill\(['"`]([^'"`]+)['"`]\)/gi
      ],
      waitFor: [
        /page\.waitForSelector\(['"`]([^'"`]+)['"`]\)/gi,
        /page\.locator\(['"`]([^'"`]+)['"`]\)\.waitFor\(\)/gi,
        /page\.getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{[^}]*name:\s*['"`]([^'"`]+)['"`][^}]*\})?\)\.waitFor\(\)/gi
      ]
    };

    // Extract click actions
    for (const pattern of patterns.click) {
      let match;
      while ((match = pattern.exec(aiResponse)) !== null) {
        const selector = match[1];
        const name = match[2] || null;
        
        actions.push({
          type: 'click',
          selector: selector,
          name: name,
          originalMatch: match[0],
          confidence: calculateConfidence(match[0], 'click')
        });
      }
    }

    // Extract fill actions
    for (const pattern of patterns.fill) {
      let match;
      while ((match = pattern.exec(aiResponse)) !== null) {
        const selector = match[1];
        const value = match[2] || match[3]; // Different capture groups for different patterns
        
        if (selector && value) {
          actions.push({
            type: 'fill',
            selector: selector,
            value: value,
            originalMatch: match[0],
            confidence: calculateConfidence(match[0], 'fill')
          });
        }
      }
    }

    // Extract waitFor actions
    for (const pattern of patterns.waitFor) {
      let match;
      while ((match = pattern.exec(aiResponse)) !== null) {
        const selector = match[1];
        const name = match[2] || null;
        
        actions.push({
          type: 'waitFor',
          selector: selector,
          name: name,
          originalMatch: match[0],
          confidence: calculateConfidence(match[0], 'waitFor')
        });
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueActions = removeDuplicates(actions);
    uniqueActions.sort((a, b) => b.confidence - a.confidence);

    console.log(`🔍 Parsed ${uniqueActions.length} actions from AI response`);
    return uniqueActions;

  } catch (error) {
    console.error(`❌ Error parsing actions: ${error.message}`);
    return [];
  }
}

/**
 * Calculates confidence score for parsed action
 * @param {string} match - matched string
 * @param {string} actionType - type of action
 * @returns {number} - confidence score (0-1)
 */
function calculateConfidence(match, actionType) {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence for more specific selectors
  if (match.includes('getByRole')) confidence += 0.3;
  if (match.includes('getByTestId')) confidence += 0.25;
  if (match.includes('getByText')) confidence += 0.2;
  if (match.includes('getByPlaceholder')) confidence += 0.2;
  if (match.includes('getByLabel')) confidence += 0.2;
  
  // Lower confidence for generic selectors
  if (match.includes('#') || match.includes('.')) confidence -= 0.1;
  if (match.includes('[')) confidence -= 0.05;
  
  // Specific action type bonuses
  if (actionType === 'click' && match.includes('button')) confidence += 0.1;
  if (actionType === 'fill' && match.includes('input')) confidence += 0.1;
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Removes duplicate actions based on selector and type
 * @param {Array} actions - array of actions
 * @returns {Array} - deduplicated actions
 */
function removeDuplicates(actions) {
  const seen = new Set();
  return actions.filter(action => {
    const key = `${action.type}:${action.selector}:${action.value || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Converts parsed actions to MCP-compatible format
 * @param {Array} actions - parsed actions
 * @param {Object} snapshot - DOM snapshot from MCP
 * @returns {Array} - MCP-compatible actions with refs
 */
function convertToMcpActions(actions, snapshot) {
  const mcpActions = [];
  
  if (!snapshot || !snapshot.elements) {
    console.warn('⚠️  No DOM snapshot available for action conversion');
    return mcpActions;
  }

  for (const action of actions) {
    try {
      // Find matching element in snapshot
      const matchingElement = findElementInSnapshot(action, snapshot);
      
      if (matchingElement && matchingElement.ref) {
        const mcpAction = {
          type: action.type,
          ref: matchingElement.ref,
          originalAction: action,
          element: matchingElement,
          confidence: action.confidence
        };
        
        if (action.value) {
          mcpAction.value = action.value;
        }
        
        mcpActions.push(mcpAction);
        console.log(`✅ Mapped action: ${action.type} -> ref:${matchingElement.ref}`);
      } else {
        console.warn(`⚠️  Could not find element for action: ${action.selector}`);
      }
    } catch (error) {
      console.error(`❌ Error converting action: ${error.message}`);
    }
  }

  return mcpActions;
}

/**
 * Finds matching element in DOM snapshot for given action
 * @param {Object} action - parsed action
 * @param {Object} snapshot - DOM snapshot
 * @returns {Object|null} - matching element or null
 */
function findElementInSnapshot(action, snapshot) {
  const { selector, name, type } = action;
  
  for (const element of snapshot.elements) {
    // Direct selector match
    if (element.selector === selector) {
      return element;
    }
    
    // Role-based matching
    if (selector.includes('button') && element.role === 'button') {
      if (!name || (element.name && element.name.includes(name))) {
        return element;
      }
    }
    
    // Text-based matching
    if (element.text && selector.includes(element.text)) {
      return element;
    }
    
    // Attribute-based matching
    if (element.attributes) {
      // Test ID matching
      if (selector.includes(element.attributes['data-testid'])) {
        return element;
      }
      
      // ID matching
      if (selector.includes('#') && selector.includes(element.attributes.id)) {
        return element;
      }
      
      // Class matching
      if (selector.includes('.') && element.attributes.class) {
        const selectorClasses = selector.match(/\.([a-zA-Z0-9_-]+)/g);
        if (selectorClasses) {
          const elementClasses = element.attributes.class.split(' ');
          const hasMatchingClass = selectorClasses.some(cls => 
            elementClasses.includes(cls.substring(1))
          );
          if (hasMatchingClass) {
            return element;
          }
        }
      }
    }
    
    // Placeholder matching for fill actions
    if (type === 'fill' && element.attributes && element.attributes.placeholder) {
      if (selector.includes(element.attributes.placeholder)) {
        return element;
      }
    }
    
    // Label matching
    if (element.label && selector.includes(element.label)) {
      return element;
    }
  }
  
  return null;
}

/**
 * Validates that actions are reasonable and safe to execute
 * @param {Array} actions - array of actions to validate
 * @returns {Object} - validation result
 */
function validateActions(actions) {
  const result = {
    valid: true,
    warnings: [],
    errors: [],
    filteredActions: []
  };
  
  const dangerousPatterns = [
    /delete/i,
    /remove/i,
    /destroy/i,
    /drop/i,
    /truncate/i
  ];
  
  for (const action of actions) {
    let actionValid = true;
    
    // Check for dangerous patterns
    const actionString = JSON.stringify(action);
    for (const pattern of dangerousPatterns) {
      if (pattern.test(actionString)) {
        result.errors.push(`Dangerous action detected: ${action.originalMatch}`);
        actionValid = false;
        break;
      }
    }
    
    // Validate fill values
    if (action.type === 'fill' && action.value) {
      if (action.value.length > 1000) {
        result.warnings.push(`Very long fill value: ${action.value.substring(0, 50)}...`);
      }
      
      // Check for potential injection patterns
      if (/<script|javascript:|data:/i.test(action.value)) {
        result.errors.push(`Potentially dangerous fill value: ${action.value}`);
        actionValid = false;
      }
    }
    
    // Validate confidence threshold
    if (action.confidence < 0.3) {
      result.warnings.push(`Low confidence action: ${action.originalMatch} (${action.confidence})`);
    }
    
    if (actionValid) {
      result.filteredActions.push(action);
    }
  }
  
  if (result.errors.length > 0) {
    result.valid = false;
  }
  
  return result;
}

export { 
  parseActions, 
  convertToMcpActions, 
  validateActions,
  findElementInSnapshot 
}; 