import {ComponentDefinition} from "./ko-component-definition";

export class Component
{
    /** @type {ComponentDefinition} */
    #componentDefinition;
    
    /** @type {String} Unique ID for component */
    #componentId;

    /**
     * @param template {string} HTML template, as a string, associated with this component
     * @param [autoBind] {object|null}
     * @param [autoBind.root] {boolean} Flag to determine if this component should be automatically bound to the component loader's root
     * @param [autoBind.dialog] {boolean} Flag to determine if component is a dialog, and to auto-bind to global dialog list
     * @param [autoBind.header] {boolean} Flag to determine if component is a header, and to auto-bind to headers list
     * @param [autoBind.footer] {boolean} Flag to determine if component is a header, and to auto-bind to footers
     * @param [autoBind.noWait] {boolean}
     * @param [autoBind.sortIndex] {number} Sort index for auto-bind. Used with header and footer flags
     * @param [autoBind.css] {string|Array<String>} CSS to inject into the page
     * @param [autoBind.params] {Object} Optional parameters when auto binding a component
     */
    constructor(template, autoBind = null)
    {
        this.#componentDefinition = ComponentDefinition.registerInstance(this, template, autoBind)
        this.#componentId = this.#componentDefinition.trackInstance();
    }
 
    get name() { return this.#componentDefinition.name; }
    get params() { return this; }
    get componentDefinition() { return this.#componentDefinition; }
    get componentId() { return this.#componentId; }
}
