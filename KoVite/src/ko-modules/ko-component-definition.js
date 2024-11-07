import {AutoBind} from './ko-auto-bind.js';

/**
 * Class that defines a component for Knockout
 */
export class ComponentDefinition
{
    /** 
     * @type {Map<string, ComponentDefinition>} Map of component definitions, keyed by component name 
     */
    static componentDefinitions = new Map();

    /**
     * @type {function|null} Function to register components with the page loader
     */
    static pageLoaderRegister = null;
    
    /** @type {string} Name of the module */
    name;
    
    /**
     * @type {function, Class} Class/function to register for any instance of component
     */
    viewModelClass;

    /**
     * @type {AutoBind|null} Settings used by the page loader to automatically bind an instance of component
     */
    autoBind;
    
    /**
     * @param name {String} Component's name
     * @param viewModelClass {function, Class} Class/function to register for any instance of component
     * @param [autoBind] {AutoBind|null} Settings used by the page loader to automatically bind an instance of component
     */
    constructor(name, viewModelClass, autoBind = null)
    {
        this.name = name;
        this.viewModelClass = viewModelClass;
        this.autoBind = autoBind;
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
     * @param viewModelClass {function, Class} Class/function to register for any instance of component
     * @param template {string} HTML template, as a string, associated with this component
     * @param [autoBind] {AutoBind} Optional AutoBind object to use for registration
     */
    static register
    (
        viewModelClass,
        template,
        autoBind
    )
    {
        let name = ComponentDefinition.camelCaseToDash(viewModelClass.name);
        if (ComponentDefinition.componentDefinitions.has(name))
            throw new Error('Component ' + name + ' already registered');

        let definition = new ComponentDefinition(name, viewModelClass, AutoBind.wrap(autoBind))
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
        
        if (ComponentDefinition.pageLoaderRegister)
            ComponentDefinition.pageLoaderRegister(definition);
        
        console.log('Registered component ' + name);
    }

    /**
     * Creates an object suitable for passing to the KO `component` binding
     * @returns {{name: string, params: Object}}
     */
    createBindingObject()
    {
        return { name: this.name, params: this.autoBind.params, sortIndex: this.autoBind.sortIndex };
    }

    static camelCaseToDash(text)
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
}
