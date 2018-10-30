//Request all source files and load them automatically
window.request = axios; //little renaming

async function load(url) {
    if (!Array.isArray(url)) url = [url];

    let promises = [];
    for (var i in url) {
        promises.push(request(url[i]));
    }
    let response = await request.all(promises);
    promises.length = 0; //clear array

    let files = {};

    let basePath = window.location.origin + "/";
    let root = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/") + 1);

    for (var r in response) {
        let url = response[r].request.responseURL;
        let name = url.substr(url.lastIndexOf("/") + 1, url.lastIndexOf(".") - (url.lastIndexOf("/") + 1));
        let folder = url.substr(url.lastIndexOf(root) + root.length, url.lastIndexOf("/") + 1 - (url.lastIndexOf(root) + root.length))
        let ext = url.substr(url.lastIndexOf(".") + 1, url.length - (url.lastIndexOf(".") + 1));
        let mimeType = response[r].headers["content-type"].split(";")[0];

        switch (mimeType) {
            case "application/json":
                files[decodeURI(name)] = response[r].data;
                break;

            case "text/javascript":
            case "application/javascript":
            case "application/x-javascript":
                if (!response[r].data) break;

                var script = document.createElement("script");
                script.type = mimeType;
                script.id = (url.lastIndexOf(root) != -1) ? url.substr(url.lastIndexOf(root) + root.length, url.length) : url.substr(url.lastIndexOf("/") + 1, url.length);

                script.text = response[r].data;
                document.body.appendChild(script);

                files[decodeURI(name)] = script;

                break;

            case "text/css":

                if (!response[r].data) break;
                //document.head.querySelector("style").innerHTML += response[r].data;
                var node = document.createElement('style');
                node.id = (url.lastIndexOf(root) != -1) ? url.substr(url.lastIndexOf(root) + root.length, url.length) : url.substr(url.lastIndexOf("/") + 1, url.length);
                node.innerHTML = response[r].data;
                document.head.appendChild(node);

                break;

            case "application/fetch":
                if (!response[r].data) break;
                promises.push(load(response[r].data.map(d => folder + d)).then(fetch => Object.assign(files, fetch)));
                break;

            default:
                console.warn("mimetype not registered for processing file '" + decodeURI(folder + name + "." + ext) + ":'", response[r].headers["content-type"]);
        }

    }
    if (promises.length > 0) {
        await request.all(promises);
    }


    //Load all scripts
    return files;
}


request("src/config.json")
    .then(response => window.config = Object.assign({}, response.data))
    .then(config => {
        CORE.config = config;
        if (config.resources)
            load(config.resources).then(f => {
                console.log("resources loaded:", f);
                CORE.init();
            });
    });

let count = 0;
var CORE = {

    modules: {},
    components:{},

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

    },

    registerComponent: function(component, name = null){
        if (!component.constructor)
            return console.error("[0] Invalid component type", component);


        switch (component.constructor.name) {
            case "Object":
                if (component.name && !name) name = component.name;
                break;
            case "Function":
                if (!name) name = component.name;//Gives function name
                break;
            default:
                console.error("[1] Invalid component type", component);
        }

            this.components[name] = component;
    }
}