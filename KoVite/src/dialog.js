import template from './dialog.html?raw';
import {Component} from "./ko-modules/ko-component";
import {PageLoader} from "./ko-modules/ko-page-loader";

export class Dialog extends Component
{
    static #instance = PageLoader.registerStaticModule(Dialog);
    static get instance() { return Dialog.#instance(); }

    constructor()
    {
        super(template, { dialog: true });
        
        this.color = ko.observable('yellowgreen');
    }
}