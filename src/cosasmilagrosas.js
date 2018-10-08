/*el codigo que hay que inyectar*/

getKeyframeCode: function( target, property, options )
{
if(!target.getLocator)
return "";
var locator = target.getLocator();
if(!locator)
return "";
return "<span title='Create keyframe for "+property+"' class='keyframe_icon' data-propertyname='" + property + "' data-propertyuid='" + locator + "/" + property + "' ></span>";
},



inspector.addLayers("layers", node.layers, { 
    name_width: 80, 
    pretitle: AnimationModule.getKeyframeCode( node, "layers"), 
    callback: function(v) {
node.layers = v;
RenderModule.requestFrame();
}});




attachKeyframesBehaviour: function( inspector )
	{
		var elements = inspector.root.querySelectorAll(".keyframe_icon");
		for(var i = 0; i < elements.length; i++)
		{
			var element = elements[i];
			element.draggable = true;
			element.addEventListener("click", inner_click );
			element.addEventListener("contextmenu", (function(e) { 
				if(e.button != 2) //right button
					return false;
				inner_rightclick(e);
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind(this));
			element.addEventListener("dragstart", inner_dragstart );
			element.addEventListener("drop", inner_drop );
		}

		function inner_click( e )
		{
			AnimationModule.insertKeyframe( e.target, e.shiftKey );
			e.preventDefault();
			e.stopPropagation();
			return true;
		}

		function inner_rightclick( e )
		{
			var menu = new LiteGUI.ContextMenu( ["Add track [UID]","Add track [name]","Copy Query","Copy Unique Query",null,"Show Info"], { event: e, title:"Property", callback: function(value) {
				if(value == "Add track [UID]")
					AnimationModule.insertKeyframe(e.target);
				else if(value == "Add track [name]")
					AnimationModule.insertKeyframe(e.target, true);
				else if(value == "Copy Query")
					AnimationModule.copyQueryToClipboard( e.target.dataset["propertyuid"], true );
				else if(value == "Copy Unique Query")
					AnimationModule.copyQueryToClipboard( e.target.dataset["propertyuid"] );
				else
					AnimationModule.showPropertyInfo( e.target.dataset["propertyuid"] );
			}});
		}

		function inner_dragstart(e)
		{
			e.dataTransfer.setData("type", "property" );
			e.dataTransfer.setData("uid", e.target.dataset["propertyuid"] );

			var locator = e.target.dataset["propertyuid"];

			//var info = LS.

			if(e.shiftKey)
				locator = LSQ.shortify( locator );
			e.dataTransfer.setData("locator", locator );
		}

		function inner_drop(e)
		{
			var element = EditorModule.getSceneElementFromDropEvent(e);
			//something to do?
		}

	},