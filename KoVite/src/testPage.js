import {ColorPanel} from "./colorPanel";

export class TestPage
{
    constructor()
    {
        this.name = ko.observable('Eric');
        
        this.myColorPanel = new ColorPanel({ color: 'Red - From JS' });
    }
}

let page = new TestPage();
ko.applyBindings(page);