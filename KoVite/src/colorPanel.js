import template from "./colorPanel.html?raw";
import {Component} from "./ko-modules/ko-component";
import {Dialog} from "./dialog";

export class ColorPanel extends Component
{
    #color;

    /**
     * @param [params] {object}
     * @param [params.color] {string} HTML color name
     */
    constructor(params)
    {
        super(template);
        
        params = params ?? {};
        this.#color = ko.observable(params.color ?? 'Default Color');
        this.#color.subscribe(newColor => Dialog.instance.color(newColor));
    }
    
    get color() { return this.#color(); }
    set color(value) { this.#color(value); }
}