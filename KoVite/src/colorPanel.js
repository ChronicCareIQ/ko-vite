import {ComponentDefinition} from "./ko-component.js";

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

const tmpTemplate = '<div>\n' +
    '    <label>Color</label>\n' +
    '    <span data-bind="text: color"></span>\n' +
    '</div>';

ComponentDefinition.register(ColorPanel, tmpTemplate);