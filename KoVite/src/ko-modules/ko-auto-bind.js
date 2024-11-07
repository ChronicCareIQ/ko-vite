/**
 * Class that defines when and how the page loading should automatically bind a KO component 
 */
export class AutoBind
{
    /** @type {boolean} Flag to determine if this component should be automatically bound to the component loader's root */
    root;

    /** @type {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list */
    dialog;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to headers list */
    header;

    /** @type {boolean} Flag to determine if component is a header, and to auto-bind to footers list */
    footer;
    
    noWait;
    
    /** @type {number} Sort index for auto-bind. Used with header and footer flags */
    sortIndex;
    
    /** @type {string|Array<String>} CSS to inject into the page */
    css;
    
    /** @type {Object} Optional parameters when auto binding a component */
    params;
    
    /**
     * @param [args] {object}
     * @param [args.root] {boolean} Flag to determine if this component should be automatically bound to the component loader's root
     * @param [args.dialog] {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list
     * @param [args.header] {boolean} Flag to determine if component is a header, and to auto-bind to headers list
     * @param [args.footer] {boolean} Flag to determine if component is a header, and to auto-bind to footers
     * @param [args.noWait] {boolean}
     * @param [args.sortIndex] {number} Sort index for auto-bind. Used with header and footer flags
     * @param [args.css] {string|Array<String>} CSS to inject into the page
     * @param [args.params] {Object} Optional parameters when auto binding a component
     */
    constructor(args)
    {
        this.root = !!args?.root;
        this.dialog = !!args?.dialog;
        this.header = !!args?.header;
        this.footer = !!args?.footer;
        this.noWait = !!args?.noWait;
        this.sortIndex = args?.sortIndex ?? 0;
        this.css = args?.css;
        this.params = args?.params;
    }

    shouldAutoBind()
    {
        return this.root || this.dialog || this.header || this.footer;
    }

    /**
     * Converts an untyped object into a strongly typed AutoBind
     * @param obj {object|AutoBind}
     * @return {AutoBind}
     */
    static wrap(obj)
    {
        if (obj instanceof AutoBind)
            return obj;

        if (obj instanceof Object)
            return new AutoBind(obj);

        return new AutoBind();
    }
}
