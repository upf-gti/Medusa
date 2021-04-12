var APP = {
    side_bar:true,
    init()
    {
        var that = this;
        EVENTS.init();
        this.addNodes();
        //this.bindEvents();
    }, 
    addNode(type, title, description) 
    {

    }, 
    addNodes()
    {
        for(let i in INFO.nodes)
        {
            var type = INFO.nodes[i];
            for(let j in type)
            {
                var node = type[j];
                console.log(node.name);
                var name = node.name;
                var description = node.description;
                var id = "#"+i+"-container";
                var html = 
                `
                <h4>`+ name +`</h4>
                <p>`+ description +`</p>
                `
                debugger;
                $( id ).append(html);
            }
        }
    }
}