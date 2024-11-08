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
    }

    return existingPreprocess(node);
};

function transformComponent(node, key)
{
    let div = document.createElement("div");
    let componentBinding = `component: { name: ko.unwrap(${key}).componentName, params: ${key}}`;
    let idBinding = `attr: { 'data-component-id': ko.unwrap(${key}).componentId }`;
    div.setAttribute('data-bind', `${componentBinding}, ${idBinding}`);

    let parent = node.parentNode;
    parent.insertBefore(div, node);
    parent.removeChild(node);

    return [div];
}
