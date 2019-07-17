
var SIMPLE = 0;
var TYPE = SIMPLE;

var PLAYING = 1;
var STOP    = 2;
var state   = STOP;

var start_time  = 0;
var time        = 0;
var timer       = null;

var animators   = [];

var current_animation = null;
var weight_of_merge   = 0.0;
var animation_speed   = 1;

var merging_mode        = true;
var enable_translation  = false;

var enable_update_camera  = false;
var use_BT                = true;

var updateTime = true;


var agent_selected = null;
var agent_selected_name = null;
var current_graph_node = null;
var agent_evaluated = null;
//stats
var num_agents = 0;

var global_dt;

var NAV_MODE = 0;
var IP_CREATION_MODE = 1;
var AGENT_CREATION_MODE = 2;
var scene_mode = NAV_MODE;

var tmp = {
  vec : vec3.create(),
  axis : vec3.create(),
  axis2 : vec3.create(),
  inv_mat : mat4.create()
}

var stats = null;

function appinit()
{
  stats = new Stats();
  document.body.append( stats.dom );

	$(stats.dom).css({
		"top": LiteGUI.sizeToCSS(window.innerHeight - 100),
		"left": LiteGUI.sizeToCSS(20),
	})

  GFX.initCanvas();
  Collada.init({ forceParser: false,  dataPath: "", workerPath: "../src/", libsPath: "../external/" });
  window.onresize = resize;
  //This animation manager will manage the gets and new Animations, not Skeletal Animations
  animation_manager = new AnimationManager(); 
  animation_manager.loadAnimation("assets/Walking.dae");
  animation_manager.loadAnimation("assets/Running.dae");  
  animation_manager.loadAnimation("assets/Idle.dae");  
  animation_manager.loadAnimation("assets/Umbrella.dae");
  animation_manager.loadAnimation("assets/Old_Man_Walk.dae");
  
  node_editor = new HBTEditor();

  
  node_editor.init();
  CORE.Player.renderStats()
  CORE.GraphManager.renderStats();
  CORE.Scene.visualizeInterestPoints();
}
function resize()
{
  GFX.context.canvas.width = GFX.context.canvas.clientWidth;
  GFX.context.canvas.height = GFX.context.canvas.clientHeight;
  GFX.context.viewport(0,0, GFX.context.canvas.width, GFX.context.canvas.height);

  console.log("resize");

  if(GFX.camera)
    GFX.camera.perspective(45, GFX.context.canvas.clientWidth / GFX.context.canvas.clientHeight, GFX.camera.near, GFX.camera.far);
}

/*********************************************************************************/
function update(dt)
{
  if(state == STOP)
    return;
  
  if(agent_selected)
    GFX.updateCamera(agent_selected.skeleton.skeleton_container);

  //Clear the path of the bt to avoid confusions when changes the path
  node_editor.graph.clearTriggeredSlots();
  //Clear the description to show as maybe the agent selected is changed or the path
  node_editor.graph.description_stack = [];
  //Evaluate each agent on the scene
  for(var c in AgentManager.agents)
  {
    var character_ = AgentManager.agents[c]; 
    agent_evaluated = character_;
    var animator = character_.animator;
    var skeleton = character_.skeleton;
    if(!animator.base_animation)
      if(isEmpty(animation_manager.animations))
        return;
      else{
        var skeletal_animation = new SkeletalAnimation("Walking", animation_manager.animations["Walking"]);
        character_.skeletal_animations["Walking"] = skeletal_animation; 
        animator.base_animation = skeletal_animation;
      }
    if(!character_.head_node)
    {
      character_.head_node = character_.getHeadNode(character_.skeleton.name);
    }

    if(!skeleton || !skeleton.skeleton_container) continue;

    if(!skeleton.root_bone)
      continue;

    node_editor.graph.runBehavior(character_, dt);
    
    character_.moveTo(character_.properties.target, dt);
    //character_.lookAt( character_.properties.look_at_pos, dt);
    // character_.orientCharacter(skeleton.skeleton_container, character_.properties.target.pos, dt);
    animator.clearMergeAnims();
    animator.animate(skeleton, dt, SIMPLE, weight_of_merge);
  }  
}

function getAnimationByName( name )
{
  for(var i in animations)
    if(animations[i].name == name)
      return animations[i];
}

function getListOfAnimations( )
{
  var result = [];
  for(var i in animations)
    result.push(animations[i].name)
  // console.log(result);
  return result
}

function onStartParsing()
{
	start_time = Date.now();
}

function clearPath(upath)
{
  var path = upath
  for(var i in path)
  {
    var wp = path[i];
    wp.visited = false;
  }
  return path;
}

function updateTargetPos()
{
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function disselectCharacter()
{
  for(var i in AgentManager.agents)
  {
    var char = AgentManager.agents[i];
    char.is_selected = false;
    char.changeColor();
  }
}

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4());//+"-"+S4());//+"-"+S4() +"-"+S4());
}


