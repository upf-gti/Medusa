function Animator()
{
  if(this.constructor !== Animator)
	 throw("You must use new to create an Animator");
	this._ctor();
}
Animator.animations = {};
Animator.addAnimation = function( animation ){
  Animator.animations[animation.name] = animation;
}


Animator.prototype._ctor = function()
{
  this.id = "Animator_" + Math.round(Math.random()*100);
  // this.animations = [];
  this.current_animation = null;
  this.last_animation = null;

  this.base_animation = null;
  this.merge_animations = [];
  this.merge_anim_names = [];

  this.current_time = 0;
  this.initialX = null;
  this.initialY = null;
  this.initialZ = null;

  this.pathX = null;
  this.pathy = null;
  this.pathZ = null;

  this.speed = 1.0;
  this.target_speed = 1.0;
  this.motion_speed = 2.6;
  this.target_motion_speed = 2.6;

  this.blend_time = 0;
  this.blend_duration = 0.5;
  this.is_blending = false;
  this.last_current_time = 0;
  this.weight_of_blend = 0;

  this.current_speed = 0;
  this.previous_speed = 0;

  /* Some temporal variables */

  this.tmp_last_pos = null;
  this.tmp_new_pos = null;
  this.tmp_new_rot = null;
  this.tmp_new_rot = null;

  /* For analytics */
  this.analyzable_joints = { mixamorig_LeftUpLeg:[]};
  this.data_analysed = false;

  this.agent_properties = null;
}
/*
* skeleton is the structure with the node
* animation can be a single animation or an array of animations
* merging nos dice si es un animate normal o un animate con mezcla previa
*/
Animator.prototype.animate = function(skeleton, dt, TYPE, weight )
{
  if(!updateTime)
    updateTime = true;
  if(!merging_mode){
    if(this.is_blending){
      //calcular toa la pesca
      this.weight_of_blend = this.blend_time/this.blend_duration;
      if(this.last_animation == null)
        this.last_animation = this.current_animation;   
      this.animateOnBlending(skeleton, [this.last_animation, this.current_animation], dt, this.weight_of_blend, this.last_current_time, TYPE);
    }
    else
      this.animateSimple(skeleton, this.current_animation, dt, TYPE)
  }
  else 
    this.animateMix(skeleton, this.base_animation,this.merge_animations, dt, weight, TYPE);
}

Animator.prototype.animateSimple = function( skeleton, animation, dt, TYPE )
{
  for( var i = 0; i < animation.takes["default"].tracks.length; ++i)
  {
    var track = animation.takes["default"].tracks[i];
    var id_search = skeleton.name + "/" + track._property_path[0];
    var node = GFX.scene._nodes_by_id[ id_search ];
    //sample will contain the tansform
    var sample = track.getSample( this.current_time * animation_speed , LS.LINEAR );
    if(node && sample)
    { 

      this.tmp_last_rot = node.rotation;
      if(enable_translation)
        node.position = sample.subarray(0,3);
      else if(!enable_translation)
        node.position[1] = sample[1];
      node.rotation = sample.subarray(3,7);
      this.tmp_new_rot = sample.subarray(3,7);
      node.updateMatrices();

    }
    skeleton.vertices = [];

    skeleton.updateLinesVertices( skeleton.root_bone );

    skeleton.addLines(skeleton.vertices);
    skeleton.addPoints(skeleton.vertices);
  }

  if(this.current_time * animation_speed > animation.takes["default"].duration)
  {
    //console.log(skeleton.skeleton_container.getGlobalPosition());
    // if(enable_translation)
    // {
    //   var that = this;
    //   this.translateRoot(that, skeleton);
    // }
    // //state = STOP;
    // if(TYPE == NO_LOOP){
    //   JUMP = false;
    //   this.previous_speed = animation_speed;
    //   this.setUpAnim(this.last_animation.name, this.previous_speed);
    //   return;
    // }
    this.current_time = 0;
    //this was for the analyzer part
    updateTime = false;
  }
}

/* 
* base anim is only an skeletalanimation
* animations is an array of [anim,weigh,target_weight]  on the future, anim.type t o determine if we reproduce
  looping or just one time and a anim.time_to_reproduce if we set an animations for a set time*/

Animator.prototype.animateMix = function( skeleton, base_anim, m_animations, dt, TYPE)
{
  var anim_samples_array = new Array();
  var base_duration = base_anim.animation.takes["default"].duration;
  this.smoothSpeed();
  this.smoothMotion();
  for(var h = 0; h < m_animations.length; h++)
  {
    var animation = m_animations[h].animation;
    var anim_current_time = m_animations[h].current_time;
    var weight = m_animations[h].weight;
    var tgt_weight = m_animations[h].target_weight;

    if(m_animations[h].type == 1)
    {
      if(anim_current_time * this.speed > animation.takes["default"].duration)
      {
        this.deleteFromMergeAnims(animation.name);
        continue;
      }
    }

    if((tgt_weight == 1) && (Math.abs(weight - tgt_weight) < 0.05))
    {
      if(m_animations[h].type != 1 && animation.name != this.base_animation.name)
      {
        // this.changeBaseAnimation(animation, m_animations[h]) //ToDo
        this.base_animation.animation = base_anim.animation = animation_manager.animations[animation.name];
        this.base_animation.current_time = base_anim.current_time = m_animations[h].current_time;
        this.base_animation.name = base_anim.name = animation.name;
        this.deleteFromMergeAnims(animation.name);
        continue;
      }
    }
    if(m_animations.length)
      weigth = this.smoothTransition(m_animations[h], weight, tgt_weight);

    var animation_samples = new Array();
    var duration2 = animation.takes["default"].duration;

    for( var j = 0; j < animation.takes["default"].tracks.length; j++)
    {
      var track_m = animation.takes["default"].tracks[j];
      animation_samples.push(track_m.getSample(anim_current_time  * this.speed, true ));
    }

    anim_samples_array.push({animation_samples, weight});
    m_animations[h].current_time += dt;

    if(m_animations[h].current_time * this.speed > animation.takes["default"].duration)
      m_animations[h].current_time = 0;
  }

  for( var k = 0; k < base_anim.animation.takes["default"].tracks.length; k++)
  {
    var track = base_anim.animation.takes["default"].tracks[k];
    if(track._property_path[0] == "mixamorig_Head")
      continue;
    var id_search = skeleton.name + "/" + track._property_path[0];
    var node = GFX.scene._nodes_by_id[ id_search ];
    //sample will contain the tansform
    var sample1 = track.getSample( base_anim.current_time * this.speed, true );
    var result = null;
    var final_pos = null;

    for(var i = 0; i< anim_samples_array.length; i++)
    {
      var samples_mix = anim_samples_array[i].animation_samples;
      var weight_ = anim_samples_array[i].weight;
      
      var sample2 = samples_mix[k];
      if(node && sample1)
      {
        result = this.interpolateSamples(track, node, sample1, sample2, weight_, result);
        //Para el movimiento en Y
        var position_1;
        if(final_pos)
          position_1 = final_pos;
        else
        {
          final_pos = vec3.create();
          position_1 = sample1.subarray(0,3);
        }
        var position_2 = sample2.subarray(0,3);
        if(track._property_path[0] == "mixamorig_Hips")
        {
          vec3.lerp(final_pos, position_1, position_2, weight_);
          node.position[1] = final_pos[1];
        }
      }
    }

    if(result)
		node.rotation = result;
      
    else
		node.rotation = sample1.subarray(3,7);


	this.agent_properties = AgentManager.agents[this.agent_id].properties;
	this.stylizer.mapEmotionToBody(this.agent_properties.happiness/100, this.agent_properties.energy/100, this.agent_properties.relax/100);
	//	  this.stylizer.applyStyle(id_search);
	this.stylizer.applyStyle(skeleton, base_anim, k);
	node.position[1] = sample1[1];
    node.updateMatrices();
    
  }

  node.position[1] = 
  skeleton.vertices = [];
  skeleton.updateLinesVertices( skeleton.root_bone );
  skeleton.addLines(skeleton.vertices);
  skeleton.addPoints(skeleton.vertices);
  this.base_animation.current_time += dt;

  if(base_anim.current_time * this.speed > base_anim.animation.takes["default"].duration)
  {
    base_anim.current_time = 0;
  }
}

Animator.prototype.animateOnBlending = function(skeleton, animations, dt, weight, last_anim_time, TYPE)
{
  //console.log("Current", this.current_time);
  var animation1 = animations[0]; //current animation
  var animation2 = animations[1]; //future animation
  var samples = new Array();

  this.blend_time += dt;
  if(this.blend_time > this.blend_duration)
  {
    this.is_blending = false;
    this.blend_time = 0;
  }  

  for( var j = 0; j < animation2.takes["default"].tracks.length; j++)
  {
    var track_m = animation2.takes["default"].tracks[j];
    // current time is 0 at the beginning for the new animation
    samples.push(track_m.getSample(this.current_time * animation_speed, true ));
  }

  for( var k = 0; k < animation1.takes["default"].tracks.length; k++)
  {
    var track = animation1.takes["default"].tracks[k];
    var id_search = skeleton.name + "/" + track._property_path[0];
    var node = GFX.scene._nodes_by_id[ id_search ];
    //sample will contain the tansform
    //last time is the time the current/old animation was on starting blending
    var sample1 = track.getSample( last_anim_time * animation_speed, true );
    var sample2 = samples[k];
    if(node && sample1)
      this.interpolateSamples(track, node, sample1, sample2, weight);
    
    skeleton.vertices = [];
    skeleton.updateLinesVertices( skeleton.root_bone );
    skeleton.addLines(skeleton.vertices);
    skeleton.addPoints(skeleton.vertices);
  }
  

  if(this.current_time * animation_speed > animation1.takes["default"].duration)
    if(TYPE == NO_LOOP) 
      return;
    this.current_time = 0;


  if(last_anim_time * animation_speed > animation2.takes["default"].duration)
    last_anim_time = 0;
}


Animator.prototype.interpolateSamples = function( track, node, sample1, sample2, weight, result )
{
  // console.log("Entra:", result);
  // console.log("Peso:", weight);
  var rotation1;

  if(result == null)
    rotation1 = sample1.subarray(3,7);
  else
    rotation1 = result;
  
  var rotation2 = sample2.subarray(3,7);
  
  var result_rotation = quat.create();
  quat.slerp(result_rotation, rotation1, rotation2, weight);
  //quat.invert(result_rotation, result_rotation);
  quat.normalize(result_rotation, result_rotation);
  

  result = result_rotation;
  // console.log("Sale:", result);
  return result;
  // node.rotation = result_rotation;
  // node.updateMatrices();
}

Animator.prototype.setUpAnim = function(animation, speed)
{
  this.last_animation = this.current_animation;
  this.is_blending = true;
  this.current_animation = getAnimationByName(animation);
  this.pathX = null;
  this.pathy = null;
  this.pathZ = null;   
  this.initialX = null;
  this.initialY = null;
  this.initialZ = null;
  this.last_current_time = this.current_time;
  this.current_time = 0;

  this.previous_speed = this.current_speed;
  this.current_speed = speed;
}

Animator.prototype.moveSkeleton = function(current_skeleton, weight_of_blend, previous_speed, current_speed, stop_near_zero)
{
  var spd = previous_speed - (previous_speed - current_speed) * weight_of_blend;
  
  if(stop_near_zero)
  {
    if(spd<0.3 && weight_of_blend > 0.85)
        spd = 0.000;
  }
  var direction = GFX.rotateVector(current_skeleton.skeleton_container.getGlobalMatrix(), [0,0,1]);
  direction = vec3.multiply(direction, direction, [spd, spd, spd]);
  vec3.add(current_skeleton.skeleton_container.position, current_skeleton.skeleton_container.position, direction);
}

Animator.prototype.clearMergeAnims = function()
{
  if(this.merge_animations.length == 0)
    return;
  for(var i = 0; i < this.merge_animations.length; i++)
  {
    var anim = this.merge_animations[i];
    if(anim.target_weight == 0)
    {
      if(anim.weight <= 0.05)
        this.deleteFromMergeAnims(anim.anim_name);
    }
  }
}

Animator.prototype.addAnimToMerge = function(name, weight, type)
{
  if(name == this.base_animation.name)
    return;
  var anim = animation_manager.animations[name];
  var skeletal_anim = new SkeletalAnimation(name, anim);
  skeletal_anim.weight = 0;
  skeletal_anim.target_weight = weight;
  skeletal_anim.type = type;
  skeletal_anim.current_time = 0.0;

  this.merge_animations.push(skeletal_anim);
  this.merge_anim_names.push(name);
}

Animator.prototype.getMergeAnim = function(name)
{
  for(var i = 0; i<this.merge_animations.length; i++)
  {
    var merge_anim = this.merge_animations[i];
    if(merge_anim.name == name)
      return merge_anim;
  }
}

Animator.prototype.checkMergeAnimByName = function(name)
{
  if(!this.merge_animations.length)
    return false;
  for(var i = 0; i < this.merge_animations.length; i++)
  {
    // console.log("MERGE ANIMS",this.merge_animations)
    var anim_name = this.merge_animations[i].name;
    if(anim_name == name)
      return true;
  }
  return false;
}

Animator.prototype.smoothTransition = function(animation, weight, tgt_weight)
{
  if( tgt_weight > weight )
  {
    weight += 0.02;
    animation.weight = weight;
  }  

  else if( tgt_weight < weight )
  {
    weight -= 0.02;
    animation.weight = weight;
  }

  else 
  {
    weight = tgt_weight;
    animation.weight = weight;
  }

  return weight;
}

Animator.prototype.smoothSpeed = function()
{
  if( this.target_speed > this.speed )
    {
      this.speed += 0.02;
    }  

    else if( this.target_speed < this.speed )
    {
      this.speed -= 0.02;
    }

    else 
    {
      this.speed = this.target_speed;
    }
}
Animator.prototype.smoothMotion = function()
{
  if( this.target_motion_speed > this.motion_speed )
    {
      this.motion_speed += 0.07;
    }  

    else if( this.target_motion_speed < this.motion_speed )
    {
      this.motion_speed -= 0.07;
    }

    else 
    {
      this.motion_speed = this.target_motion_speed;
    }
}

Animator.prototype.deleteFromMergeAnims = function( anim_name )
{
  // console.log(anim_name);
  var index = this.merge_animations.indexOf(this.getMergeAnim(anim_name));
  if (index !== -1)this.merge_animations.splice(index, 1); 

  var index2 = this.merge_anim_names.indexOf(this.getMergeAnim(anim_name));
  if (index2 !== -1)this.merge_anim_names.splice(index, 1); 

}

/* Interpretar y aplicar Behaviour devuelto por el Tick del BT ? */ 

Animator.prototype.applyBehaviour = function( behaviour )
{
  // Check animations, and the ones that not are in behaviour but in the merge_animations, 
  // put the target_weight to 0, and if weight is 0, delete from the array
  for(var j = 0; j < this.merge_animations.length; j++)
  {
    var a_anim = this.merge_animations[j];
    var in_behaviour = false;
    for(var k = 0; k < behaviour.animation_to_merge.length; k++)
    {
      var b_anim = behaviour.animation_to_merge[k];
      if(a_anim.anim_name == b_anim.name)
        in_behaviour = true; 
      else{
        a_anim.target_weight = 0;
      }
    }
  }

  if(behaviour.type2 == "mixing")
  {
    // en el futuro habrá más parametros, por lo que tendre que hacer un
    // configure y almazenar los parametros en un objeto del animator para
    // poder acceder a traves de la key
    this.target_speed = behaviour.speed;
    this.target_motion_speed = behaviour.motion;

//    for(var i = 0; i < behaviour.animation_to_merge.length; i++)
//    {
      // debugger;
      var animation = behaviour.animation_to_merge;
      if(animation.name == this.base_animation.animation.name)
        return;
      if( !this.checkMergeAnimByName( animation.name ) )
      {
          this.addAnimToMerge(animation.name, animation.weight, animation.type);
      }
      else{
          var anim = this.getMergeAnim(animation.name);
          anim.target_weight = animation.weight;
      }
//    }
  }
}