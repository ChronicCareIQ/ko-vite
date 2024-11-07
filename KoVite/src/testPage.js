import {PageLoader} from "./ko-modules/ko-page-loader.js";
import {ComponentDefinition} from "./ko-modules/ko-component-definition.js";
import {ColorPanel} from "./colorPanel";
import template from "./testPage.html?raw";

export class TestPage
{
    constructor()
    {
        this.name = ko.observable('Eric');
        
        this.myColorPanel = new ColorPanel({ color: 'Red - From JS' });
    }
}

ComponentDefinition.verbose = true;
ComponentDefinition.register(TestPage, template, { root: true });
PageLoader.setComponentsToLoader();