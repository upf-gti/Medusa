



class Labels {
    constructor(){
        this.labels = {};
        var canvas = this.canvas = document.createElement('canvas');
        this.canvas.classList.add("canvas-labels");
        this.ctx = canvas.getContext('2d');

        if (!this.ctx.constructor.prototype.fillRoundedRect) {
            // Extend the canvaseContext class with a fillRoundedRect method
            this.ctx.constructor.prototype.fillRoundedRect = 
              function (xx,yy, ww,hh, rad, fill, stroke) {
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
        if( !this.toogled && false )    return;

        let children = GFX.scene._root.children;
        let ctx =  this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "16px Arial";
        
        for(let c in children){
            let node = children[c];

            if( !node.visible || !node.mesh ) 
                continue;

            let screenpos = GFX.camera.project(node.getGlobalPosition(false, true));
            
            //skip if behind camera
            if(screenpos[2] > 1) continue;

            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.fillStyle = "rgba(33, 33, 33, .5)";

            var name = node.name || node.mesh || node.id;

            ctx.fillRoundedRect(screenpos[0] - 10, this.canvas.height - screenpos[1] - 21, name.length * 10 + 10, 32, 5);
            
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(node.name,screenpos[0], this.canvas.height - screenpos[1]);
        }
    }
}

CORE.registerModule( Labels );