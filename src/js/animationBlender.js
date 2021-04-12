function AnimationBlender()
{
  if(this.constructor !== AnimationBlender)
	 throw("You must use new to create an AniAnimationBlendermator");
	this._ctor();
}

AnimationBlender.prototype._ctor = function()
{
	this.main_skeletal_animation = null;
	this.layers                  = [];                       //array of skeletal animations and weights
	this.current_time            = 0;
	this.playback_speed          = 2.0;
	this.motion_speed            = 0.0*this.playback_speed;
	this.target_motion_speed     = 0.0;
	this.look_at_factor 		 = 0.0;
	this.previous_neck_quat 	 = null;
	this.initial_neck_quat 		 = null;
}

AnimationBlender.prototype.animateSimple = function( agent, dt)
{
	if(this.main_skeletal_animation.duration)
		this.main_skeletal_animation.assignTime( this.current_time);

	agent.scene_node.bones = this.main_skeletal_animation.skeleton.computeFinalBoneMatrices( agent.scene_node.bones, gl.meshes[ agent.scene_node.mesh ] );
	if(agent.scene_node.bones && agent.scene_node.bones.length)
		agent.scene_node.uniforms.u_bones = agent.scene_node.bones;

	this.current_time += dt*this.playback_speed;
}

AnimationBlender.prototype.animateMerging = function( agent, dt, options )
{
	options = options || {};

	var node = agent.scene_node || options.node;

	if(!node) throw("No animation node");

	if(this.main_skeletal_animation.duration)
		this.main_skeletal_animation.assignTime( this.current_time );

	if(this.layers.length > 0)
	{
		if(this.layers.length == 1)
		{
			var layer_1 = this.layers[0];
			//if there is a useless layer
			if(layer_1.target_weight == 0)
			{
				this.deleteLayer(layer_1.id);
				return;
			}

			layer_1.sk_animation.assignTime(layer_1.current_time);

			//smooth weight to make it progressive
			this.smoothWeight( layer_1, layer_1.weight, layer_1.target_weight );
			
			//apply the changes into the main skeleton
			Skeleton.blend( this.main_skeletal_animation.skeleton, layer_1.sk_animation.skeleton, layer_1.weight, this.main_skeletal_animation.skeleton );  
			layer_1.current_time += dt*this.playback_speed;
		}
		else if(this.layers.length > 1)
			console.log("TODO: more than 2 animations being blended");
		
	}

	else
	{
		if(this.main_skeletal_animation.duration)
		this.main_skeletal_animation.assignTime( this.current_time);
	}
	//console.log(this.main_skeletal_animation.skeleton);
	this.smoothMotion( this.target_motion_speed );
	// this.smoothPlaybackSpeed( this.target_playback_speed );

	//Stylization layer modifying the agent.scene_node.bones, to be passed later to the shader
	//here we have the bones models local (as we want in the stylizer)
	//we modify the agent.scene_node.bones by getting the index (inside the functions of stylize) 
	if(stylize)
	{
		agent.stylizer.stylizeSpine(this.main_skeletal_animation.skeleton.bones, this.main_skeletal_animation.skeleton.bones_by_name, agent.properties.valence);
		agent.stylizer.stylizeShoulders(this.main_skeletal_animation.skeleton.bones, this.main_skeletal_animation.skeleton.bones_by_name, agent.properties.arousal);
	}
	//Look At
	this.lookAt(this.main_skeletal_animation.skeleton.bones, this.main_skeletal_animation.skeleton.bones_by_name, "mixamorig_Neck", agent.properties.look_at_pos, agent)
	
	this.playback_speed = 1 + (agent.properties.valence/100)*0.2
	node.bones = this.main_skeletal_animation.skeleton.computeFinalBoneMatrices( node.bones, gl.meshes[ node.mesh ] );
	
	if(node.bones && node.bones.length)
		node.uniforms.u_bones = node.bones;

	this.current_time += dt*this.playback_speed;
}

AnimationBlender.prototype.lookAt = function ( bones, bones_by_name, name, target, agent)
{
	var i_neck = bones_by_name.get(name);
	var neck = bones[i_neck];
	
	var trans = vec3.create();
    var scale = vec3.create();
	var neck_quat = quat.create();
    var temp_mat3 = mat3.create();
    var M = mat4.clone(neck.model);
	var direction = vec3.create();
	var rotation = quat.create();
	var tmp_mat = mat4.create();
	var aux_quat = quat.create();
	
    mat4.getScaling(scale, neck.model);
    mat4.getTranslation(trans, neck.model);
    var M3 = mat3.fromMat4( temp_mat3, M );
    quat.fromMat3AndQuat( neck_quat, M3, 2 );
	
	if(!target )
	{
		rotation = neck_quat;
	} 
	else{

		vec3.subtract(direction, target, agent.scene_node.getGlobalPosition());
		quat.lookRotation(rotation, direction, vec3.fromValues(0,1,0));
	}
	

	if(this.previous_neck_quat == null)
	{
		quat.slerp(aux_quat, rotation, neck_quat, slerp_q );  
		this.previous_neck_quat = aux_quat;
	}
	
	else
	{
		var angle =  quat.getAngle(this.previous_neck_quat, rotation);
		angle = angle*RAD2DEG;
		if(angle < 5)
		{
			aux_quat = this.previous_neck_quat;
		}
		else
		{
			quat.slerp(aux_quat, rotation, this.previous_neck_quat, slerp_q );  
			this.previous_neck_quat = aux_quat;

		}
	}
	
	mat4.fromRotationTranslationScale(tmp_mat, aux_quat, trans, scale);
    mat4.copy(neck.model, tmp_mat);
}

AnimationBlender.prototype.applyBehaviour = function( behaviour )
{
	// if(behaviour.motion == null || behaviour.motion == undefined || !behaviour.animation_to_merge) return;

	if(behaviour.motion != null || behaviour.motion != undefined)
		this.target_motion_speed = behaviour.motion*this.playback_speed;

	if(this.isAnimInLayers(behaviour.animation_to_merge) || behaviour.animation_to_merge.name == this.main_skeletal_animation.name)
		return;
	this.addLayer(behaviour.animation_to_merge, 1);
	
}

AnimationBlender.prototype.isAnimInLayers = function( animation )
{
	for(var i in this.layers)
	{
		if(this.layers[i].sk_animation.name == animation.name)
			return true;
	}
}	

AnimationBlender.prototype.smoothWeight = function(layer, weight, target )
{
	var dif = weight - target;

	if(Math.abs(dif) < 0.1)
	{
		layer.weight = target;
		if(target == 1.0 )
		{
			//debugger;
			this.setMainAnimation(layer.sk_animation);
			this.current_time = layer.current_time;
			this.deleteLayer(layer.id);
		}
		return;
	}
	if(weight < target)
		layer.weight += 0.02;
	else
		layer.weight -= 0.02;
}
AnimationBlender.prototype.smoothMotion = function(new_motion)
{
	if(Math.abs(this.motion_speed-new_motion) < 0.1)
		return;

	if( this.motion_speed > new_motion )
    {
      this.motion_speed -= 0.07;
    }  

    else if( this.motion_speed < new_motion )
    {
      this.motion_speed += 0.07;
    }

    else 
    {
      this.motion_speed = this.target_motion_speed;
    } 
}


AnimationBlender.prototype.setMainAnimation = function( sk_anim )
{
	this.main_skeletal_animation = sk_anim;
}

AnimationBlender.prototype.addLayer = function( anim, weight )
{
	var layer_weight = 0;
	var layer_current_time = 0;
	if(this.main_skeletal_animation.duration > 0)
	{
		var mod = this.current_time % this.main_skeletal_animation.duration;
		var layer_current_time = (mod/this.main_skeletal_animation.duration)*anim.duration;
	}
	else
		layer_current_time = Math.random()*anim.duration;
	//if there is already an animation being mixed
	if(this.layers.length > 0)
	{
		//set the time
		layer_weight = this.layers[0].weight;
		//delete the layer to put the new one
		this.deleteLayer(this.layers[0].id);
	}

	var layer = {
		id : this.layers.length,
		sk_animation:anim, 
		weight: layer_weight, 
		target_weight: weight,
		current_time : layer_current_time
	}

	this.layers.push(layer);
}

AnimationBlender.prototype.deleteLayer = function( id )
{
	for(var i = 0; i < this.layers.length; i++)
	{
		if(this.layers[i].id == id)
		{
			index = this.layers.indexOf(this.layers[i]);
			this.layers.splice(index, 1);
		}
		
	}
	console.log("info", "layer deleted");
}
