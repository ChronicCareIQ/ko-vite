class ModuleParameters
{
    /** @type {ko.componentLoader.Reference} */
    ref;

    /**
     * Copies all properties from the given object to this object. Used to set root module's module via CSHTML embedded Model
     * @param params
     */
    copyParams(params)
    {
        delete params.ref;
        Object.assign(this, params);
    }
}

export class KoModule
{
    /** @type {string} Name of the module */
    name;

    /** @type {boolean} Flag to determine if this component should be automatically bound to the component loader's root */
    root;

    /** @type {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list */
    dialog;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to headers list */
    header;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to footers list */
    footer;

    /** @type {ModuleParameters} */
    params;

    /**
     * @param [args] {object}
     * @param [args.root] {boolean} Flag to determine if this component should be automatically bound to the component loader's root
     * @param [args.dialog] {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list
     * @param [args.header] {boolean} Flag to determine if component is a header, and to auto-bind to headers list
     * @param [args.footer] {boolean} Flag to determine if component is a header, and to auto-bind to footers
     * @param [args.params] {ModuleParameters} Parameters for the module (typically null)
     */
    constructor(args)
    {
        this.root = !!args?.root;
        this.dialog = !!args?.dialog;
        this.header = !!args?.header;
        this.footer = !!args?.footer;
        this.params = args?.params ?? new ModuleParameters();
    }

    /**
     * Converts an untyped object into a strongly typed KoModule object
     * @param obj {object|KoModule}
     * @return {KoModule}
     */
    static wrap(obj)
    {
        if (obj instanceof KoModule)
            return obj;

        if (obj instanceof Object)
            return new KoModule(obj);

        return new KoModule();
    }

    shouldAutoBind()
    {
        return this.root || this.dialog || this.header || this.footer;
    }

    /**
     * Builds ref for anything bound by loader
     */
    createReference()
    {
        if (!this.shouldAutoBind() || this.params.ref)
            return;

        this.params.ref = ko.componentLoader.ref.child();
    }

    /**
     * @param viewModelClass {function, Class} Class to register for any instance of component
     * @param template {string} HTML template, as a string, associated with this component
     * @param [component] {KoModule} Optional KoModule object to use for registration
     */
    static register
    (
        viewModelClass,
        template,
        component
    )
    {
        let name = camelCaseToDash(viewModelClass.name);
        ko.components.register(name, {
            viewModel: viewModelClass,
            template: template
        });

        /** @type {KoModule} */
        viewModelClass.component = KoModule.wrap(component);
        viewModelClass.component.name = name;

        component = viewModelClass.component;
        component.createReference();

        let self = ko.componentLoader;
        if (component.root && self.root() !== component)
        {
            component.params.copyParams(self.rootModule.params);                    // copy page's module to root component
            self.root(component);
            ko.applyBindings(self);                                                 // kick off KO binding for page
        }
        else if (component.dialog && self.dialogs.indexOf(component) < 0)
            self.dialogs.push(component);
        else if (component.header && self.headers.indexOf(component) < 0)
        {
            self.headers.push(component);
            self.headers.sort(sortByIndex);
        }
        else if (component.footer && self.footers.indexOf(component) < 0)
        {
            self.footers.push(component);
            self.footers.sort(sortByIndex);
        }

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
