import {ComponentDefinition} from "./ko-component-definition.js";
import {Component} from "./ko-component.js";


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

class StaticModule
{
    /**
     * @type {function, Class} Class/function to register for any instance of component
     */
    #viewModelClass;
    
    #reference = ko.observable();

    /**
     * @param viewModelClass {function, Class} Class/function to register for any instance of component
     */
    constructor(viewModelClass)
    {
        this.#viewModelClass = viewModelClass;
    }
    
    get reference() { return this.#reference; }

    /**
     * Gets or builds an instance of the registered class
      * @returns {*}
     */    
    getInstance()
    {
        let instance = this.#reference();
        if (instance) return instance;
            
        instance = new this.#viewModelClass();
        this.#reference(instance);
        return instance;
    }
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
    
    /** @type {StaticModule[]} Collection of components to auto bind when `setComponentsToLoader` runs */
    static #staticModules = [];
    
    constructor()
    {
        this.loading = ko.observable(true);
        this.loadingMessage = ko.observable("Loading...");

        this.components = ko.observableArray([]);
        this.root = ko.observable();
        this.dialogs = ko.observableArray([]);
        this.headers = ko.observableArray([]);
        this.footers = ko.observableArray([]);
        this.rootModule = new RootModule();
    }
    
    setLoadedCallback(callback)
    {
        this.#loadedCallback = callback;
    }

    /**
     * @param options {Object}
     * @param [options.verbose] {boolean} If true, verbose logging is enabled
     * @param [options.loadedCallback] {function} Callback function when all components are loaded
     * @param [options.popState] {boolean} If true, registers for popstate events
     * @return {PageLoader} Returns this instance
     */
    setOptions(options)
    {
        if (typeof options.verbose !== "undefined") 
        {
            let toSet = !!options.verbose;
            PageLoader.verbose = toSet;
            ComponentDefinition.verbose = toSet;
        }
        if (typeof options.loadedCallback === "function") this.#loadedCallback = options.loadedCallback;
        if (typeof options.popState === "boolean") this.#popState = options.popState;
        return this;
    }
    
    static buildLoader()
    {
        if (typeof ko === undefined) throw 'Knockout is required, please ensure it is loaded before using componentLoader plug-in';

        ComponentDefinition.pageLoaderRegister = PageLoader.register;
        PageLoader.instance = new PageLoader();
        return PageLoader.instance;
    }

    /**
     * Registers a static component type with the page loader, which is later used during the `setComponentsToLoader` 
     * method to automatically bind references of the component type to the loader.
     * 
     * @param viewModelClass
     * @return {KnockoutObservable<*>} Returns the observable reference to the component
     */
    static registerStaticModule(viewModelClass)
    {
        let staticModule = new StaticModule(viewModelClass);
        PageLoader.#staticModules.push(staticModule);
        return staticModule.reference;
    }

    /**
     * Sets all global / static components to the loader. Call this method after all components have been registered.
     * @param root {Component} Root component to set
     */
    static setComponentsToLoader(root)
    {
        let loader = PageLoader.instance;
        if (loader.root())
            throw 'Root component already set: ' + loader.root().name;
        
        if (root == null || !root instanceof Component)
            throw 'Root component must be a Component instance';

        // Sets reference to root component
        loader.root(root);
        
        // Binds all static components to the loader
        PageLoader.#staticModules.forEach(staticModule => 
        {
            let instance = staticModule.getInstance();
            loader.bind(instance);
        });        
        
        let definitions = Array.from(ComponentDefinition.componentDefinitions.values());
        definitions.forEach(definition =>
        {
            loader.#addCssLinks(definition);
        });

        document.addEventListener('ko.component.definition:loaded', () => loader.#doLoaded());
        document.addEventListener('DOMContentLoaded', () => ko.applyBindings(loader));
    }

    /**
     * Performs any automatic binding associated with CSS for passed component
     *
     * @param definition {ComponentDefinition}
     */
    #addCssLinks(definition)
    {
        let autoBind = definition.autoBind;
        if (!autoBind.css)
            return;
        
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

    /**
     * Registers an instance of a component with the loader to include in either the header, footer, or dialog collections
     *
     * @param component {Component} Root component to set
     * @return {Component} Returns the component instance
     */
    bind(component)
    {
        let definition = component.componentDefinition;
        let autoBind = definition.autoBind;
        
        if (autoBind.dialog)
        {
            if (this.dialogs().find(x => x.name === definition.name))
                throw `Component ${definition.name} is already bound as a dialog.`;
            
            this.dialogs.push(component);
        }
        else if (autoBind.header)
        {
            if (this.headers().find(x => x.name === definition.name))
                throw `Component ${definition.name} is already bound as a header.`;
            
            this.headers.push(component);
            this.headers.sort(PageLoader.sortByIndex);
        }
        else if (autoBind.footer)
        {
            if (this.footers().find(x => x.name === definition.name))
                throw `Component ${definition.name} is already bound as a footer.`;
            
            this.footers.push(component);
            this.footers.sort(PageLoader.sortByIndex);
        }
        else
            throw `Component ${definition.name} is not configured to globally bind with the page-loader. Needs one of the following properties: dialog, header, or footer.`;

        return component;
    }
    
    static sortByIndex(a, b)
    {
        let aSortIndex = !a || typeof a.sortIndex !== "number" ? -1*Number.MIN_VALUE : a.sortIndex;
        let bSortIndex = !b || typeof b.sortIndex !== "number" ? -1*Number.MIN_VALUE : b.sortIndex;
        return aSortIndex - bSortIndex;
    }

    #doLoaded()
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
            this.handlePopState(null, this.getJsonFromUrl());
        }
        if (PageLoader.verbose) console.log('Page popState');
    }
    
    #registerPopstate()
    {
        window.addEventListener('popstate', event =>
        {
            let urlParams = this.getJsonFromUrl();
            this.#handlePopState(event, urlParams);
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

PageLoader.buildLoader();