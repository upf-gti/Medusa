var IDLE = 0;
var UP = 1;
var ROTATE_LEFT = 2;
var ROTATE_RIGHT = 4;
var RUN = 8;
var MOVE = IDLE;
var JUMP = false;

var SIMPLE = 0;
var MIXING = 1;
var NO_LOOP = 2;
var TYPE = SIMPLE;

var PLAYING = 1;
var STOP    = 2;
var state   = STOP;

var start_time  = 0;
var time        = 0;
var timer       = null;

var skeletons   = [];
var animations  = [];
var animators   = [];
var characters = []; 
var base_animation  = null;
var merge_animations = null;

var current_animation = null;

var weight_of_merge   = 0.0;
var animation_speed   = 1;

var target_weight = 0.0;
var target_speed = 1.0;

var merging_mode        = true;
var enable_translation  = false;
var blending_time       = 0.5;

var enable_update_camera  = false;
var use_BT                = true;
var DEBUG       = true;
var setting_done = false;

var updateTime = true;

var target_node = null;
var tgt_node_up = false;
var tgt_node_down = false;
var tgt_node_left = false;
var tgt_node_right = false;

var rotated = false;

var BT = null;
var BT_list = [];
var node_editor = null;

var current_dragged = null;
var last_message_id = 0;

var creation_mode = false;
var path_mode = false;

var agent_selected = null;
var current_graph_node = null;
var agent_evaluated = null;
//stats
var num_agents = 0;

var global_dt;

var IP_CREATION_MODE = 1;
var NAV_MODE = 0;
var scene_mode = NAV_MODE;

var tmp = {
  vec : vec3.create(),
  axis : vec3.create(),
  axis2 : vec3.create(),
  inv_mat : mat4.create()
}

function appinit()
{
  GFX.initCanvas();
  Collada.init({ forceParser: false,  dataPath: "", workerPath: "../src/", libsPath: "../external/" });
  window.onresize = resize;
  //This animation manager will manage the gets and new Animations, not Skeletal Animations
  animation_manager = new AnimationManager();

  animation_manager.newAnimation("src/assets/Walking.dae");
  animation_manager.newAnimation("src/assets/Running.dae");
  animation_manager.newAnimation("src/assets/Old_Man_Walk.dae");
  animation_manager.newAnimation("src/assets/Idle.dae");
  animation_manager.newAnimation("src/assets/Umbrella.dae");
  animation_manager.newAnimation("src/assets/StandUp.dae");
  animation_manager.newAnimation("src/assets/Tripping.dae");
  
  BT = new BehaviourTree();
  node_editor = new BTEditor(BT);
  BT_list.push(BT);
  
  node_editor.init();
  CORE.Player.renderStats()
  CORE.GraphManager.renderStats();
  CORE.Scene.visualizeInterestPoints();

  // paintInCanvas(node_editor.graph_canvas.canvas.getContext("2d"));
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
  
  if(enable_update_camera)
    GFX.updateCamera();

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

    if(!character_.head_node)
    {
      character_.head_node = character_.getHeadNode(character_.skeleton.name);
      console.log(character_.head_node);
      var lookatnode = new RD.SceneNode();
      lookatnode.mesh = "cube";
      lookatnode.position = character_.properties.look_at_pos;
      lookatnode.color = [1,0,0,1];
      lookatnode.scaling = 10;
      lookatnode.render_priority = 1;
      GFX.scene.root.addChild(lookatnode);
    }

    if(!skeleton || !skeleton.skeleton_container) continue;

    if(!skeleton.root_bone)
      continue;

    if(!BT.rootnode)
      return;

    node_editor.graph.runStep(1,false);
    if(BT.fixed_node)
      BT.fixed_node.tick(character_, dt);
    else
      BT.rootnode.tick(character_, dt);
    
    character_.moveTo(character_.properties.target, dt);
    character_.lookAt( character_.properties.look_at_pos, dt);
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
  // if(tgt_node_down)
  //   target_node.position[2] += 10;

  // if(tgt_node_up)
  //   target_node.position[2] -= 10;

  // if(tgt_node_right)
  //   target_node.position[0] += 10;
  
  // if(tgt_node_left)
  //   target_node.position[0] -= 10;

  // target_node.updateMatrices();
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

