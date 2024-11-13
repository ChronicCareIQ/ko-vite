import {PageLoader} from "./ko-modules/ko-page-loader.js";
import {Component} from "./ko-modules/ko-component.js";
import {ColorPanel} from "./colorPanel";
import template from "./testPage.html?raw";
import {NameSpan} from "./nameSpan";

export class TestPage extends Component
{
    constructor()
    {
        super(template, { root: true });
        this.userName = ko.observable('Eric');
        
        this.myColorPanel = new ColorPanel({ color: 'Red - From JS' });
        this.myNameSpan = new NameSpan();
        this.mvc = new Mvc();
    }
    
    handleOnLoaded()
    {
        console.log('TestPage loaded');
    }
}

PageLoader.instance.setOptions({ verbose: true });
PageLoader.setComponentsToLoader(new TestPage());