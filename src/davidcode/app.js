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

//stats
var num_agents = 0;


function appinit()
{
  GFX.initCanvas();
  Collada.init({ forceParser: false,  dataPath: "", workerPath: "../src/", libsPath: "../external/" });
  window.onresize = resize;

  // blackboard = new Blackboard();
  // blackboard.setArea(-2500,-2500,0,2500);
  
  // blackboard2 = new Blackboard();
  // blackboard2.setArea(0,-2500,2500,2500);
  // blackboard2.rain = 1.5;

  // animator = new Animator();
  // animators.push( animator );
  // skeleton = default_skeleton = new Skeleton("skeleton1", "src/assets/Walking.dae", [0, 0, 0], false);
  // character = new Character("Billy", skeleton, animator);
  // character.state["age"] = 20;
  // characters.push(character);

  // animator2 = new Animator();
  // animators.push( animator );
  // skeleton2 = new Skeleton("skeleton2", "assets/Idle.dae", [575, 0, 0], false);
  // character2 = new Character("Jonny", skeleton2, animator2);
  // character2.state["age"] = 60;
  // characters.push(character2);


  skeleton2 = new Skeleton("skeleton2", "src/assets/Running.dae", [150, 0, 0], true);
  skeleton3 = new Skeleton("skeleton2", "src/assets/Old_Man_Walk.dae", [100, 0, 0], true);
  skeleton4 = new Skeleton("skeleton2", "src/assets/Idle.dae", [100, 0, 0], true);
  skeleton5 = new Skeleton("skeleton2", "src/assets/Walking.dae", [150, 0, 0], true);

  // createTree2();
  
  
  node_editor = new BTEditor();
  BT = new BehaviourTree(node_editor);
  BT_list.push(BT);
  
  node_editor.init();
  //GUI.initializeGUI();
  
  // target_node = new RD.SceneNode();
  // target_node.mesh = "sphere";
  // target_node.scaling = 35;
  // target_node.shader = "phong"
  // target_node.color = [1.0,0.0,0.0,1];
  // target_node.position = [200,0,1000]
  // GFX.scene.root.addChild(target_node);

  //character.visualizePath();

  // character.state.target = target_node.position;
  // character2.state.target = target_node.position;

  // cond_node = new ConditionalNode(123, BT, blackboard, BT.tree, "is_raining?", "rain", 0);
  createDefaultAreas();

  CORE.Player.renderStats()
  CORE.GraphManager.renderStats();
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
  // updateTargetPos();
  if(state == STOP)
    return;
  
  if(enable_update_camera)
    GFX.updateCamera();

  for(var i = 0; i < characters.length; i++)
  {
    var character_ = characters[i]; 
    var animator = characters[i].animator;
    var skeleton = characters[i].skeleton;

    //  ULTRAMEGAREQUETESUPERHARDCODEADO --> HACER GESTION DE ZONAS Y BLACKBOARDS
    // checkZone(character_);
    if(!skeleton || !skeleton.skeleton_container) continue;
    if(skeleton.skeleton_container.getGlobalPosition()[0] > 0)
    {
      character_.blackboard = blackboard2;
    }
    else{
      character_.blackboard = blackboard;
    }

    if(!skeleton.root_bone)
      continue;

    if(animator.current_animation == null){
      var anim_name = skeleton.anim_name.split("/");
      animator.current_animation = getAnimationByName(anim_name[2].slice(0, -4));
      //GUI.current_animation_name = animator.current_animation.name;
      //GUI.tools_inspector.refresh();
    }
  
    if(!animator.base_animation)
    {
      // debugger;
      var anim_name = skeleton.anim_name.split("/");
      animator.base_animation = getAnimationByName(anim_name[2].slice(0, -4));
      animator.merge_animations = [];
      // animator.addAnimToMerge("Walking", 0.0);
      // animator.addAnimToMerge("Walking_Backwards", 0.0);
      // animator.addAnimToMerge("Running", 0.0);
      setting_done = true;
    }
  
    if(!setting_done)
      return;
    
    
    if(!DEBUG)
    {
      /************************************** Controling BillyBoy **************************************************/
        if((MOVE&UP) > 0)
          animator.moveSkeleton(skeleton, animator.weight_of_blend, animator.previous_speed, animator.current_speed);
      
        else if((MOVE&RUN) > 0)
          animator.moveSkeleton(skeleton, animator.weight_of_blend, animator.previous_speed, animator.current_speed);
      
        if( (MOVE&ROTATE_RIGHT) > 0 )
          skeleton.skeleton_container.rotate(-1*DEG2RAD, [0,1,0], true);
        
        if( (MOVE&ROTATE_LEFT) > 0 )
          skeleton.skeleton_container.rotate(1*DEG2RAD, [0,1,0], true);
      
        else if( MOVE == IDLE)
          animator.moveSkeleton(skeleton, animator.weight_of_blend, animator.previous_speed, animator.current_speed, true);
      
        skeleton.skeleton_container.updateMatrices();
      
      /***********************************************************************************************************/
    }

    var anim = character_.animator.getMergeAnim("Idle");
    // if(anim && (anim.target_weight > 0))
    //   anim.target_weight = 0;     
    // debugger;    
    BT.rootnode.tick(character_);

    if(character_.inTarget(character_.current_waypoint.pos, 150))
    {
      character_.current_waypoint.visited = true;
      if(character_.path.indexOf(character_.current_waypoint) == character_.path.length-1)
      {
        // console.log("Vuelve al primero");
        character_.restorePath();
      }
      character_.getNextWaypoint();
    }
    // console.log(dt);
    character_.moveTo(character_.current_waypoint.pos, dt);
    animator.clearMergeAnims();

    animator.animate(skeleton, dt, SIMPLE, weight_of_merge);
    animator.last_current_time += dt;
  
    if(updateTime)
      animator.current_time += dt;
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

function createBtree(editor)
{
  
  // var is_raining = BT.addConditionalNode(2,"rain", 0.5);
  // var walk = BT.addAnimationNode(3, [{anim: "Walking", weight:1.0}], 1, 3);
  // var run = BT.addAnimationNode(4, [{anim: "Running", weight:1.0}], 1, 5);

  // BT.rootnode.addChildren(is_raining); //conditional
  // BT.rootnode.addChildren(walk);       //action
  // is_raining.addChildren(run);         //action
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
  for(var i in characters)
  {
    var char = characters[i];
    char.is_selected = false;
    char.changeColor();
  }
}

function createDefaultAreas()
{
  area1 = new RD.SceneNode();
  area1.name = "area1";
  area1.mesh = "planeXZ";
  area1.position = [2500, 0, 0];
  area1.blend_mode = RD.BLEND_ALPHA;
  area1.flags.depth_test = false;
  area1.scale([5000, 1, 10000]);
  area1.color = [0,1,1,0.05];
  GFX.scene.root.addChild(area1);

  area2 = new RD.SceneNode();
  area2.name = "area2";
  area2.mesh = "planeXZ";
  area2.position = [-2500, 0, 0];
  area2.blend_mode = RD.BLEND_ALPHA;
  area2.flags.depth_test = false;
  area2.scale([5000, 1, 10000]);
  area2.color = [0.25,1,0,0.05];
  GFX.scene.root.addChild(area2);

  area3 = new RD.SceneNode();
  area3.name = "area3";
  area3.mesh = "planeXZ";
  area3.texture = "sunny.png";
  area3.position = [-300, 2, 0];
  area3.blend_mode = RD.BLEND_ALPHA;
  area3.flags.depth_test = false;
  area3.scale([500, 1, 500]);
  area3.rotate(90*DEG2RAD, [0,-1,0]);
  GFX.scene.root.addChild(area3);

  area4 = new RD.SceneNode();
  area4.name = "area4";
  area4.mesh = "planeXZ";
  area4.scale([500, 1, 500]);
  area4.blend_mode = RD.BLEND_ALPHA;
  area4.flags.depth_test = false;
  area4.texture = "rainy.png";
  area4.position = [300, 0, 0];
  area4.rotate(90*DEG2RAD, [0,1,0]);
  GFX.scene.root.addChild(area4);
}

//init();

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4());//+"-"+S4());//+"-"+S4() +"-"+S4());
}

