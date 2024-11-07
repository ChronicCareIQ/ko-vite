import {Reference} from "./ko-reference.js";
import {ComponentDefinition} from "./ko-component-definition.js";

class RootModule
{
    #params = {};

    /**
     * @param value {object} Parameters to use for the root module
     */
    set params(value) { this.#params = value; }

    /**
     * @returns {Object} Parameters to use for the root module
     */
    get params() { return this.#params; }
}

export class PageLoader
{
    /** @type {PageLoader} singleton instance */
    static instance;
    
    static verbose = false;
    
    /** @type {function} Callback function when all components are loaded */
    #loadedCallback;
    
    #cssLoaded = [];

    /** @type {boolean} Flag to determine whether to register for Popstate events */
    #popState;
    
    /** @type {Reference} */
    ref;
    
    constructor()
    {
        this.loading = ko.observable(true);
        this.loadingMessage = ko.observable("Loading...");

        this.components = ko.observableArray([]);
        this.root = ko.observable();
        this.dialogs = ko.observableArray([]);
        this.headers = ko.observableArray([]);
        this.footers = ko.observableArray([]);
        this.ref = new Reference(null).setOptions({ completedCallback: () => this.#onRefCompleted(), componentName: 'page.loader' });
        this.attached = () => this.ref;
        this.rootModule = new RootModule();
    }
    
    static buildLoader()
    {
        if (typeof ko === undefined) throw 'Knockout is required, please ensure it is loaded before using componentLoader plug-in';

        ComponentDefinition.pageLoaderRegister = PageLoader.register;
        PageLoader.instance = new PageLoader();
        return PageLoader.instance;
    }

    /**
     * @param definition {ComponentDefinition}
     */
    static register(definition)
    {
        PageLoader.instance.addComponent(definition);   
    }

    /**
     * Performs any automatic binding associated with passed component (if applicable, see AutoBind for details)
     * 
     * @param definition {ComponentDefinition}
     */
    addComponent(definition)
    {
        let autoBind = definition.autoBind;
        
        if (autoBind.css)
        {
            let cssList = typeof autoBind.css === "string" ? [autoBind.css] : autoBind.css;
            cssList.forEach(css =>
            {
                if (this.#cssLoaded.indexOf(css) >= 0)
                    return;

                this.#cssLoaded.push(css);
                
                let linkDom = document.createElement('link');
                linkDom.setAttribute('type', 'text/css');
                linkDom.setAttribute('href', css);
                linkDom.setAttribute('rel', 'stylesheet');
                document.head.appendChild(linkDom);
            });
        }
        
        if (!autoBind.shouldAutoBind())
            return;
        
        let bindingObject = definition.createBindingObject();
    
        if (autoBind.root)
        {
            if (this.root() && this.root().name !== bindingObject.name)
                throw 'Root component already set: ' + this.root().name;
            
            this.root(bindingObject);

            document.addEventListener('DOMContentLoaded', () => ko.applyBindings(this));
        }
        else if (autoBind.dialog && this.dialogs.find(x => x.name === bindingObject.name) === undefined)
        {
            this.dialogs.push(bindingObject);
        }
        else if (autoBind.header && this.header.find(x => x.name === bindingObject.name) === undefined)
        {
            this.headers.push(bindingObject);
            this.headers.sort(PageLoader.sortByIndex);
        }
        else if (autoBind.footer && this.footer.find(x => x.name === bindingObject.name) === undefined)
        {
            this.footers.push(bindingObject);
            this.footers.sort(PageLoader.sortByIndex);
        }
    }
    
    static sortByIndex(a, b)
    {
        let aSortIndex = !a || typeof a.sortIndex !== "number" ? -1*Number.MIN_VALUE : a.sortIndex;
        let bSortIndex = !b || typeof b.sortIndex !== "number" ? -1*Number.MIN_VALUE : b.sortIndex;
        return aSortIndex - bSortIndex;
    }

    onComponentAttached(viewModel, ref)
    {
        /*
        let name = viewModel.constructor.name;
        name = ComponentDefinition.camelCaseToDash(name);
    
        let component = findComponent(name);
        if (!component && verbose && this.components().length) console.log('Component not found. Ignoring attached event for component ' + name);
        if (!component) return;
    
        component.isLoaded = true;
        component.viewModel = viewModel;
        if (PageLoader.verbose) console.log('Loaded component ' + name + '\tOutstanding ' + retrieveOutstanding().join());
        if (ref && !ref.componentName) ref.setComponentName(name);       
         */
    }

    #onRefCompleted()
    {
        if (PageLoader.verbose) console.log('Reference counts are completed');
    
        if (!this.loading()) return;
    
        if (PageLoader.verbose) console.log('All loaded');
        window.setTimeout(() => this.doLoaded, 0);     // assures loading is done by putting at back of call queue            
    }

    doLoaded()
    {
        this.loading(false);                                // makes visible before callback
        if (PageLoader.verbose) console.log('Page ready');
        
        let root = this.root();
        if (this.#loadedCallback)
            this.#loadedCallback(this);
        else if (root && root.viewModel && typeof root.viewModel.handleOnLoaded === "function")
            root.viewModel.handleOnLoaded(self);
    
        let event = new CustomEvent('ko.page.loader:loaded', { detail: this });
        document.dispatchEvent(event);

        if (window.ironpdf)
            window.ironpdf.notifyRender();                                                             // notifies PDF generator, if present
        if (PageLoader.verbose) console.log('Page loaded');
    
        if (this.#popState)
        {
            this.#registerPopstate();
            this.handlePopState(null, this.getJsonFromUrl(), this.ref);
        }
        if (PageLoader.verbose) console.log('Page popState');
    }

/*
    function retrieveOutstanding()
{
    let result = [];
    let components = this.components();
    for (let i = 0; i < components.length; i++)
        if (!components[i].isLoaded && !components[i].noWait)
            result.push(components[i].name);
    return result;
}
*/
    
    setLoadedCallback(callback)
    {
        this.#loadedCallback = callback;
    }

    /**
     * @param options {Object}
     * @param [options.headLess] {boolean} If true, the loader is not bound to KO
     * @return {PageLoader} Returns this instance
     */
    setOptions(options)
    {
        if (options.headLess) this.ref.attached(this);      // loader isn't bound using KO
        if (typeof options.verbose !== "undefined") PageLoader.verbose = options.verbose ? true : false;
        if (typeof options.loadedCallback === "function") this.#loadedCallback = options.loadedCallback;
        if (typeof options.popState === "boolean") this.#popState = options.popState;
        return this;
    }
    
    #registerPopstate()
    {
        window.addEventListener('popstate', event =>
        {
            let urlParams = this.getJsonFromUrl();
            this.#handlePopState(event, urlParams, this.ref);
        });
    }

    #handlePopState(event, urlParams, top)
    {
        for (let i = 0; i < top.children.length; i++)
        {
            let child = top.children[i];
            let instance = child.instance();
            if (instance && typeof instance.handlePopState === "function")
                instance.handlePopState(event, urlParams);
    
            this.#handlePopState(event, urlParams, child);
        }
    }

    getJsonFromUrl()
    {
        let result = {};
        if (!location.search) return result;
        
        let query = location.search.substr(1);
        query.split("&").forEach(function (part)
        {
            let item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    }

    objectToUrl(params) 
    {
        const p = new URLSearchParams();
        for (const [ key, value ] of Object.entries( params ) ) 
            p.set( key, String( value ) );
        return p.toString();
    }
    
    pushState(values, args)
    {
        args = args || {};
    
        let locationSearch = args.locationSearch;
        if (locationSearch === undefined)
        {
            let qParams = Object.assign(this.getJsonFromUrl(), values);
            for (let key in qParams)
                if (qParams.hasOwnProperty(key) && qParams[key] === null)
                    delete qParams[key];
    
            let qText = this.objectToUrl(qParams);
            locationSearch = qText.length === 0 ? "" : "?" + qText;
        }
    
        let url = window.location.origin + window.location.pathname + locationSearch;
    
        if (window.history && args.replaceState)
            window.history.replaceState({}, '', url);
        else if (window.history)
            window.history.pushState({}, '', url);
    }    
}

function attachedInit(element, valueAccessor, allBindings, viewModel)
{
    if (valueAccessor() === 'parent')
        element = element.parentNode;

    let ref;
    if (viewModel.attached)
        ref = viewModel.attached(element);  // calls component's attached method

    if (ref && ref !== PageLoader.instance.ref)
        PageLoader.instance.onComponentAttached(viewModel, ref);  // internally tracks outstanding components

    if (ref && ref instanceof Reference)
        ref.attached(viewModel);    // updates reference counts
}

function attachedHandlerInit(element, valueAccessor)
{
    let handler = valueAccessor();
    handler(element);
}

PageLoader.buildLoader();

ko.bindingHandlers.attached = { init: attachedInit };
ko.bindingHandlers.attachedHandler = { init: attachedHandlerInit };
ko.extenders.ref = function (target, option) { target.ref = option; return target; };
