import {Component} from "./ko-modules/ko-component.js";
import template from "./mvc.html?raw";

export class Mvc extends Component
{
    constructor()
    {
        super(template);
        this.counter = ko.observable(0);
        this.increment = () => this.counter(this.counter() + 1);
    }
}