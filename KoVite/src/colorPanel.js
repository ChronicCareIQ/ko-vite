import {KoModule} from "./ko-module";

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
        this.#color = ko.observable(params.color ?? 'Brown');
    }
    
    get color() { return this.#color(); }
    set color(value) { this.#color(value); }
}

const tmpTemplate = '<div>\n' +
    '    <label>Color</label>\n' +
    '    <span data-bind="text: color"></span>\n' +
    '</div>';

KoModule.register(ColorPanel, tmpTemplate);