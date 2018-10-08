//18/09/2018

class GUI{
    constructor(){
       
        LiteGUI.init();
        var main_area = this.root = new LiteGUI.Area({id:"main-area"});
        LiteGUI.add(main_area);

        main_area.split("vertical",["40.67px", null] );

        var menu = this.menu = new LiteGUI.Menubar("menu");
        main_area.getSection(0).add(menu);



        this.root = main_area.getSection(1);
    }

    postInit(){
        this.toggleGUI( true );
    }

    /**
     * Toggle between displaying or hidding the content.
     * @param {boolean} v - true : display, false : hide
     */
    toggleGUI ( v ){
        document.body.style.opacity = (!!v)? 1.0 : 0.0;
    }

}

CORE.registerModule( GUI );