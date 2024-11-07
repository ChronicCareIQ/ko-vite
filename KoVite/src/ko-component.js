/**
 * Class that defines a component for Knockout
 */
export class ComponentDefinition
{
    /** 
     * @type {Map<string, ComponentDefinition>} Map of component definitions, keyed by component name 
     */
    static componentDefinitions = new Map();
    
    /** @type {string} Name of the module */
    name;
    
    /**
     * @type {function, Class} Class/function to register for any instance of component
     */
    viewModelClass;
    
    /** @type {boolean} Flag to determine if this component should be automatically bound to the component loader's root */
    root;

    /** @type {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list */
    dialog;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to headers list */
    header;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to footers list */
    footer;

    /**
     * @param [args] {object}
     * @param [args.root] {boolean} Flag to determine if this component should be automatically bound to the component loader's root
     * @param [args.dialog] {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list
     * @param [args.header] {boolean} Flag to determine if component is a header, and to auto-bind to headers list
     * @param [args.footer] {boolean} Flag to determine if component is a header, and to auto-bind to footers
     */
    constructor(args)
    {
        this.root = !!args?.root;
        this.dialog = !!args?.dialog;
        this.header = !!args?.header;
        this.footer = !!args?.footer;
    }

    shouldAutoBind()
    {
        return this.root || this.dialog || this.header || this.footer;
    }
    
    /**
     * Factory method to create a view model instance. If an instance is already passed, then it is simply returned. Otherwise,
     * a new instance is created with the passed parameters.
     * @param params {object} Parameters to pass to the view model constructor
     * @param componentInfo {object} Component information, like element, etc.
     */
    createViewModel(params, componentInfo)
    {
        if (params instanceof this.viewModelClass)
            return params;
        
        let instance = new this.viewModelClass(params);
        return instance;
    }

    /**
     * Converts an untyped object into a strongly typed ComponentDefinition
     * @param obj {object|ComponentDefinition}
     * @return {ComponentDefinition}
     */
    static wrap(obj)
    {
        if (obj instanceof ComponentDefinition)
            return obj;

        if (obj instanceof Object)
            return new ComponentDefinition(obj);

        return new ComponentDefinition();
    }
    
    /**
     * @param viewModelClass {function, Class} Class/function to register for any instance of component
     * @param template {string} HTML template, as a string, associated with this component
     * @param [definition] {ComponentDefinition} Optional ComponentDefinition object to use for registration
     */
    static register
    (
        viewModelClass,
        template,
        definition
    )
    {
        let name = camelCaseToDash(viewModelClass.name);
        if (ComponentDefinition.componentDefinitions.has(name))
            throw new Error('Component ' + name + ' already registered');

        definition = ComponentDefinition.wrap(definition);
        definition.name = name;
        definition.viewModelClass = viewModelClass;
        ComponentDefinition.componentDefinitions.set(name, definition);        
        
        ko.components.register(name, 
        {
            viewModel: 
            {
                createViewModel: (params, componentInfo) => definition.createViewModel(params, componentInfo)
            },
            template: template
        });
        
        console.log('Registered component ' + name);
    }
}

function camelCaseToDash(text)
{
    if (typeof text !== "string" || text.length < 2) return text;

    var last = ' ', result = '';
    for (var i = 0; i < text.length; i++)
    {
        var x = text.charAt(i);
        if (last.match(/[A-Za-z]/) && x.match(/[A-Z]/))
            result += '-';

        result += x.toLowerCase();
        last = x;
    }
    return result;
}
