import {ColorPanel} from "./colorPanel";

export class TestPage
{
    constructor()
    {
        this.name = ko.observable('Eric');
        
    }
}

let page = new TestPage();
ko.applyBindings(page);