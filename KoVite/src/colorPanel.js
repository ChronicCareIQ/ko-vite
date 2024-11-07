import {ComponentDefinition} from "./ko-component.js";
import template from "./colorPanel.html?raw";

export class ColorPanel
{
    #color;

    /**
     * @param [params] {object}
     * @param [params.color] {string} HTML color name
     */
    constructor(params)
    {
        params = params ?? {};
        this.#color = ko.observable(params.color ?? 'Default Color');
    }
    
    get color() { return this.#color(); }
    set color(value) { this.#color(value); }
}

ComponentDefinition.register(ColorPanel, template);