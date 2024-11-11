import {Component} from './ko-modules/ko-component';
import template from './nameSpan.html?raw';

export class NameSpan extends Component
{
    constructor()
    {
        super(template);
        this.firstName = ko.observable('Eric'); 
        this.lastName = ko.observable('Eschenbach');
    }
}