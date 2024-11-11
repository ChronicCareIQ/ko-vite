// see documentation here: https://knockoutjs.com/documentation/binding-preprocessing.html
const existingPreprocess = ko.bindingProvider.instance.preprocessNode || function() {};

ko.bindingProvider.instance.preprocessNode = function(node)
{
    // https://developer.mozilla.org/en-US/docs/Web/API/Element
    if (node.nodeType === 1)
    {
        if (node.localName === 'component')
        {
            let key = node.getAttribute('instance');
            if (key)
                return transformComponent(node, key);
        }
        else if (isFirstElementOfComponent(node) && !hasAttachedBinding(node))
        {
            return autoInjectAttachedBinding(node);
        }
    }

    return existingPreprocess(node);
};

/**
 * @param node {HTMLElement}
 * @param key
 * @returns {HTMLElement[]}
 */
function transformComponent(node, key)
{
    let elementType = node.getAttribute('element') ?? 'div';
    let componentDom = document.createElement(elementType);
    let componentBinding = `component: { name: ko.unwrap(${key}).componentName, params: ${key}}`;
    let idBinding = `attr: { 'data-component-id': ko.unwrap(${key}).componentId }`;
    componentDom.setAttribute('data-bind', `${componentBinding}, ${idBinding}`);

    let parent = node.parentNode;
    parent.insertBefore(componentDom, node);
    parent.removeChild(node);

    return [componentDom];
}

/**
 * Returns true element is the top most element of a component.
 * @param element {HTMLElement}
 * @returns {boolean} True if the element is the top most element of a component; false otherwise.
 */
function isFirstElementOfComponent(element)
{
    let parent = element.parentElement;
    if (!parent)
        return false;
    
    let binding = parent.getAttribute('data-bind');
    if (!binding)
        return false;
    
    return binding.includes('component:');
}

/**
 * Return true if element or any of its immediate children are have an `attached` binding.
 */
function hasAttachedBinding(element)
{
    if (element.getAttribute('data-bind') && element.getAttribute('data-bind').includes('attached:'))
        return true;
    
    for (let child of element.children)
        if (child.getAttribute('data-bind') && child.getAttribute('data-bind').includes('attached:'))
            return true;
    
    return false;
}

/**
 * @param node {HTMLElement}
 * @param key
 * @returns {HTMLElement[]}
 */
function autoInjectAttachedBinding(node, key)
{
    let tagName = node.tagName.toLowerCase();
    if (tagName !== 'div' && tagName !== 'span')
        throw `The top most element of a component must be a DIV or SPAN, found: ${tagName}. This is a limitation of the auto-injecting attached binding feature. To work around this limitation, manually add an 'attached' binding to the top most element of the component.`;
    
    let attachedDom = document.createElement(tagName);
    attachedDom.setAttribute('data-bind', "attached: 'parent'");
    node.append(attachedDom);
    
    return [attachedDom];
}
