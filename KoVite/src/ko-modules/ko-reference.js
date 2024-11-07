export class Reference
{
    static verbose = false;
    
    /** @type {Reference} */
    #parent;
    #initialCompleted = false;
    #isAttached = false;
    #childrenComplete = 0;
    #completedCallback;
    #subscriptions = [];

    /**
     * @param [parent] {Reference|null} Parent reference. Defaults to `null`
     */
    constructor(parent = null) 
    {
        this.#parent = parent;
        this.#completedCallback = ko.observable(this);
        this.children = [];
        this.instance = ko.observable();
    }
    
    /**
     * @param args {object}
     * @param args.completedCallback {function} Callback to call when reference is completed
     * @param args.componentName {string} Name of the component
     * @param args.initialCompleted {boolean} Flag to determine if initialization is complete
     * @returns {Reference} Returns new child instance
     */
    child(args)
    {
        let toAdd = new Reference(this).setOptions(args || {});
        this.children.push(toAdd);
        return toAdd;
    }

    /**
     * @param args {object}
     * @param [args.completedCallback] {function} Callback to call when reference is completed
     * @param [args.componentName] {string} Name of the component
     * @param [args.initialCompleted] {boolean} Flag to determine if initialization is complete
     * @returns {Reference} Returns this instance
     */
    setOptions(args)
    {
        if (args.completedCallback) this.addCompletedCallback(args.completedCallback);
        if (args.componentName) this.setComponentName(args.componentName);
        if (args.initialCompleted != null) this.#initialCompleted = !!args.initialCompleted;
        return this;
    }

    /**
     * @param name {string} Name of the component
     * @returns {Reference} Returns this instance
     */
    setComponentName(name)
    {
        this.componentName = name;
        return this;
    }

    /**
     * @param callback {function} Callback to call when reference is completed
     * @returns {Reference} Returns this instance
     */
    addCompletedCallback(callback)
    {
        let subscription = this.#completedCallback.subscribe(() => callback(this.instance(), this));
        this.#subscriptions.push(subscription);
        return subscription;
    }

    /**
     * Removes and disposes of all subscriptions, then clears the instance and parent references
     */
    dispose()
    {
        this.#subscriptions.forEach(sub => sub.dispose());
        this.#subscriptions.length = 0;
        this.instance(null);
        this.#parent = null;
    }
    
    /**
     * Set reference to KO component (aka viewModel) 
     * @param viewModel
     */
    attached(viewModel)
    {
        this.#isAttached = true;
        this.instance(viewModel);
        this.notify();
    }

    /**
     * Notify that a child has completed
     */
    childCompleted()
    {
        this.#childrenComplete++;
        this.notify();
    }

    notify()
    {
        if (Reference.verbose) console.log('Notify ' + this.componentName + ' isAttached=' + this.#isAttached + ' children=' + this.children.length + ' complete=' + this.#childrenComplete);
        if (!this.#isAttached || this.#childrenComplete !== this.children.length || this.#initialCompleted)
            return;

        this.#initialCompleted = true;
        this.#completedCallback(this);

        if (parent)
            parent.childCompleted();
    }

    /**
     * Creates a child reference object on the passed object, if one does not already exist
     * @param item {object} Object to track reference on
     * @param [item.ref] {Reference} Reference object to use
     * @returns {Reference}
     */
    refForItem(item)
    {
        item.ref = item.ref ?? this.child();
        return item.ref;
    }

    refWrap(item) { return this.refForItem(item); }
}    
