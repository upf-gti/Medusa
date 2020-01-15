



class Labels {
    constructor(){
        this.labels = {};
        this.agent_label_visibility = false;
        this.ip_label_visibility = false;
        var canvas = this.canvas = document.createElement('canvas');
        this.canvas.classList.add("canvas-labels");
        this.ctx = canvas.getContext('2d');

        if (!this.ctx.constructor.prototype.fillRoundedRect) {
            // Extend the canvaseContext class with a fillRoundedRect method
            this.ctx.constructor.prototype.fillRoundedRect = 
              function (xx,yy, ww, hh, rad, fill, stroke) {
                if (typeof(rad) == "undefined") rad = 5;
                this.beginPath();
                this.moveTo(xx+rad, yy);
                this.arcTo(xx+ww, yy,    xx+ww, yy+hh, rad);
                this.arcTo(xx+ww, yy+hh, xx,    yy+hh, rad);
                this.arcTo(xx,    yy+hh, xx,    yy,    rad);
                this.arcTo(xx,    yy,    xx+ww, yy,    rad);
                if (stroke) this.stroke();  // Default to no stroke
                if (fill || typeof(fill)=="undefined") this.fill();  // Default to fill
            }; // end of fillRoundedRect method
        } 
    }

    postInit(){
        CORE.Player.panel.content.prepend(this.canvas);
        
        window.addEventListener("resize", this.resize.bind(this));
        //CORE.GUI.root.add( this.panel );
        this.resize();
    }


    /**
     * Toggle between displaying or hidding the content.
     * @param {boolean} v - true : display, false : hide
     */
    toogleLabels(){}

    resize(){
        if(!this.canvas) return;
       this.canvas.width = CORE.Player.panel.root.clientWidth;
       this.canvas.height = CORE.Player.panel.root.clientHeight;
    }

    update(){
        // console.log(this.visible);

        let agents_list = CORE.AgentManager.agents;
        let interest_points = CORE.Scene.properties.interest_points;
        let ctx =  this.ctx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.font = "14px Arial";
        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.fillStyle = "rgba(33, 33, 33, .5)";

        if(this.agent_label_visibility)
            for(let i in agents_list)
            {
                let agent = agents_list[i];
                if(!agent.scene_node) 
                    continue;
                var position = agent.scene_node.getGlobalPosition(false, true);
                var name = agent.properties.name || agent.id;
                this.drawLabel(ctx, position, name)
            }

        if(this.ip_label_visibility)
            for(let j in interest_points)
            {
                let interest_p_type = interest_points[j];
                for(let h in interest_p_type)
                {
                    let interest_p = interest_p_type[h];
                    if(!interest_p.position) 
                        continue;

                    var name = interest_p.name || interest_p.id;
                    this.drawLabel(ctx, interest_p.position, name);
                }
            }
    }

    drawLabel(ctx,  position, text )
    {
        let screenpos = GFX.camera.project(position);
                    
        //skip if behind camera
        if(screenpos[2] > 1) return;

        // var w = text.length * 14;
        var w = ctx.measureText(text).width + 20;
        // console.log(ctx.measureText("hola"));
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillRoundedRect(screenpos[0] - 5, this.canvas.height - screenpos[1] - 21, w , 32, 5);
        ctx.textAlign = "center";
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(text, screenpos[0] + w*0.5, this.canvas.height - screenpos[1]);
        
        ctx.fillStyle = "rgba(33, 33, 33, .5)";
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

CORE.registerModule( Labels );