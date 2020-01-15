/*
*   Alex Rodríguez
*   @jxarco 
*/

var CORE = {

    modules: [],

    init: function() {
        //Load all scripts
        for (var f in this.modules)
            if (this.modules[f].preInit) this.modules[f].preInit(); //To load independent things that may be used by other components
        for (var f in this.modules)
            if (this.modules[f].init) this.modules[f].init(); //Init
        for (var f in this.modules)
            if (this.modules[f].postInit) this.modules[f].postInit(); //If you specifically wait for some module to be loaded
    },

    registerModule: function(module, name = null) {

        if (!module.constructor)
            return console.error("[0] Invalid module type", module);

        var instance
        switch (module.constructor.name) {
            case "Object":
                if (module.name && !name) name = module.name;
                instance = module;
                break;
            case "Function":
                if (!name) name = module.name;
                instance = new module();
                break;
            default:
                console.error("[1] Invalid module type", module);
        }

        if (instance)
            CORE[name] = this.modules[name] = instance;

    }
}

var ResourceManager = RM = {
        version: 1.0,
        nocache: false,
        debug_imports: false,

    init: function()
    {
        console.log("%cLoading application, please wait...","color: #76cccc; font-size: 16px" );
        this.setup();
        this.onInit();
    },

    setup: function()
    {
		console.log(navigator.userAgent);
    },

    onInit: function()
    {
        LiteGUI.request({
            url: "src/config.json?nocache=" + performance.now(),
            dataType: "json",
            nocache: true,
            success: this.onRequest.bind(this)
        });
    },

    onRequest: function(config)
    {
        if(!config) 
        throw("Configuration file not found");

        this.config = config;

        if(config.nocache)
            this.nocache = config.nocache;

        if(config.resources && config.resources.constructor === Array)
            this.onReadImports(config);
    },

    onReadImports: function( config )
    {
        var that = this;
        var import_list = config.resources;
    
        var userAgent = (navigator && navigator.userAgent || '').toLowerCase();

		if(/android/.test(userAgent) || /mobile/.test(userAgent))
		{
            var aux = [];
            for(var i = 0; i < import_list.length; i++)
                aux.push( import_list[i] );

            import_list = aux;
        }

        if(this.nocache) {
            var nocache = "?nocache" + performance.now();
            for(var i in import_list)
            import_list[i] += nocache;
        }

        this.totalImports = import_list.length;
        LiteGUI.requireScript(import_list, onLoad, onError, onProgress);

        function onLoad(loaded_scripts)
        {
            var last_loaded = loaded_scripts[ loaded_scripts.length - 1 ];
            var name = last_loaded.original_src.split('?')[0];
            // console.log(name);
			

			CORE.init();
        }

        function onProgress(name, num)
        {

           // console.log(name);

        }

        function onError(error, name)
        {
            console.error("Error loading script " + name);
        }
    }
};