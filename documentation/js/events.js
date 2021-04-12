var EVENTS  = 
{
    init()
    {
        this.bindEvents();
    },
    hideContent()
    {
        $( "#about-container" ).hide();
        $( "#interface-container" ).hide();
        $( "#nodes-container" ).hide();
        $( "#tool-container" ).hide();
        $( "#hbtree-container" ).hide();
    },
    bindEvents()
    {
        var that = this;
        $( "#about-section" ).click(function() {
            that.hideContent();
            $( "#about-container" ).css("display", "flex");

        });
        $( "#interface-section" ).click(function() {
            that.hideContent();
            $( "#interface-container" ).show()

        });
        $( "#nodes-section" ).click(function() {
            that.hideContent();
            $( "#nodes-container" ).css("display", "flex");
        });
        $( "#hbtree-section" ).click(function() {
            that.hideContent();
            $( "#hbtree-container" ).show();
        });
        $( "#tool-section" ).click(function() {
            that.hideContent();
            $( "#tool-container" ).show();
        });


        $( "#open-side" ).on("click", function() {

            if(APP.side_bar == true)
            {
                $( "#sidebar-wrapper" ).hide(); 
                APP.side_bar = false;
            }
            else if(APP.side_bar == false){

                $( "#sidebar-wrapper" ).show();
                APP.side_bar = true;
            }
        });

        var acc = document.getElementsByClassName("accordion");
        var i;
        for (i = 0; i < acc.length; i++) 
        {
            acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;

            if (panel.style.maxHeight)
                panel.style.maxHeight = null;
            else 
                panel.style.maxHeight = panel.scrollHeight + "px";
        });
        }
    }
}