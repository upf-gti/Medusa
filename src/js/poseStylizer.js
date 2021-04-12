function PoseStylizer ()
{
    if(this.constructor !== PoseStylizer)
    throw("You must use new to create an PoseStylizer");
   this._ctor();
}

PoseStylizer.prototype._ctor = function()
{
    this.emotions = 
    {
        "happiness":{
            weight:1,
            style_rotations:[],
            properties:{
                prop_speed:1
            }
        },
        "sadness":{
            weight:0,
            style_rotations:[],
            properties:{
                prop_speed:0.7
            }

        },
        "anger":{
            weight:0,
            style_rotations:[],
            properties:{
                prop_speed:1.2
            }

        },
        "relax":{
            weight:0,
            style_rotations:[],
            properties:{
                prop_speed:0.7
            }
        },
        "fear":{
            weight:0,
            style_rotations:[],
            properties:{
                prop_speed:1.2
            }
        }
    }

	this.body_weights = 
	{	
		"spine_tilt": 0,
		"shoulders_weight": 0,
		"arm_space": 0,
		"body_leaning": 0,
		"footstep": 0
	}
	
	this.emotions_effectors = [];
	this.happiness_effectors = null;
	this.energy_effectors = null;
    this.relax_effectors = null;
    
    this.tmp_mat = mat4.create();

    this.t_pose_arm_quat = quat.create();
}

PoseStylizer.prototype.setTPoseQuat = function( X, Y, Z )
{
    this.t_pose_arm_quat = quat.create();
    return quat.fromEuler(this.t_pose_arm_quat, vec3.fromValues(X, Y, Z)); 
}

/*
* Interpret what an emotion represent to specific parts of the body
* parameters are the values of happiness, energy and relaz [-1,1]
*/
PoseStylizer.prototype.mapEmotionToBody = function(happiness, energy, relax)
{
	/*for happiness*/
	this.emotions_effectors = [];
	this.happiness_effectors = {
		"spine":-happiness*0.4, 
		"shoulder_weight": -happiness*0.9
	}

	this.energy_effectors = {
		"spine": -energy*0.2, 
		"shoulder_weight": -energy*0.9
	}

	this.relax_effector = {
		"spine": -relax*0.2, 
		"arm_space": -relax*0.9,
		"shoulder_weight": -relax*0.5
	}

	this.emotions_effectors.push(this.happiness_effectors);
	this.emotions_effectors.push(this.energy_effectors);
	this.emotions_effectors.push(this.relax_effector);
	
	var spine = 0;
	var spine_counter = 0;
	var shoulder = 0;
	var shoulder_counter = 0;
	var arms = 0;
	var arms_counter = 0;

	for(var i in this.emotions_effectors){
	
		if( this.emotions_effectors[i].spine != 0)
		{
			spine =+ this.emotions_effectors[i].spine;
			spine_counter++;	
		}
	}
	if(spine_counter == 0) 
		this.body_weights.spine_tilt = 0;
	else
		this.body_weights.spine_tilt = spine/spine_counter;

	for(var i in this.emotions_effectors){

		if(this.emotions_effectors[i].shoulder_weight != 0)
		{
			shoulder =+ this.emotions_effectors[i].shoulder_weight;
			shoulder_counter++;	
		}
	}
	if(shoulder_counter == 0)
		this.body_weights.shoulders_weight = 0;
	else
		this.body_weights.shoulders_weight = shoulder/shoulder_counter;


	this.body_weights.arm_space = this.relax_effector.arms_space;

}

/* 
*   This method extracts the differences between the first frame of two animations
*   If two animations are differents (walk and idle), the differences would not make sense
*/
PoseStylizer.prototype.extractStyleRotations = function(animation1, animation2)
{
  var samples1 = [];
  var samples2 = [];
  var style_rotations = [];

  //Extract samples on time = 0 of the first animation
  for( var i = 0; i < animation1.takes["default"].tracks.length; i++)
  {
      var bone_track = animation1.takes["default"].tracks[i];
      samples1.push(bone_track.getSample(0, true ));
  }

  //Extract samples on time = 0 of the second animation
  for( var j = 0; j < animation2.takes["default"].tracks.length; j++)
  {
      var bone_track2 = animation2.takes["default"].tracks[j];
      samples2.push(bone_track2.getSample(0, true ));
  }

  for(var k = 0; k < samples1.length; k++)
  {
    var joint1 = samples1[k];
    var joint2 = samples2[k];
    // debugger;
    var quat1 = quat.fromValues(joint1[3], joint1[4], joint1[5], joint1[6]);
    var quat2 = quat.fromValues(joint2[3], joint2[4], joint2[5], joint2[6]);

    var inv_q1 = quat.create();
    var final_quat = quat.create();

    quat.invert(inv_q1, quat1);
    quat.multiply(final_quat, inv_q1, quat2);

    style_rotations.push(final_quat);

    // console.log(style_rotations);
  }
  
  return style_rotations;
}

/*  
*   In the near future it will call the different stilizers as the
*   spine stylizer, legs stylizer or arms stylizer 
*/
PoseStylizer.prototype.applyStyle = function(skeleton, base_anim, k)
{
	this.applySpineStyle(skeleton, base_anim, k);
//	this.applyArmsStyle(skeleton, base_anim, k);
//	this.applyShoulderStyle(skeleton, base_anim, k);
}

PoseStylizer.prototype.applySpineStyle = function(skeleton, base_anim, k)
{
	
    /*Loop on the skeleton and if it is not a spine/neck joint continue */
    /*Inside this, know how much weight of each action apply*/
    /*The emotions can be given by agent properties*/
    var track = base_anim.animation.takes["default"].tracks[k];
    var id_search = skeleton.name + "/" + track._property_path[0];
    if(!id_search.includes("Spine") && !id_search.includes("Neck"))
        return;
    var node = GFX.scene._nodes_by_id[ id_search ];
//    var style_rotation;
//    if(emotional_value > 0)
//        style_rotation = this.emotions.happiness.style_rotations[k];
//    else    
//        style_rotation = this.emotions.sadness.style_rotations[k];
//    var final_quat = quat.create();
//    var half_q = quat.create();
//	quat.slerp(half_q, quat.create(),node.rotation, this.body_weights.spine_tilt )
//    quat.multiply(final_quat, node.rotation, half_q);
//    node.rotation = final_quat;
	node.rotate(DEG2RAD*15*this.body_weights.spine_tilt, [1,0,0]);
    node.updateMatrices();
}

PoseStylizer.prototype.rotateBoneByAngle = function (array_of_bones,bones_by_name, name, f )
{
    var index_spine = bones_by_name.get(name);
    var spine = array_of_bones[index_spine];
    this.tmp_mat = mat4.create();
    mat4.rotate(this.tmp_mat, spine.model, DEG2RAD*5* (-f), [1,0,0]);
    mat4.copy(spine.model, this.tmp_mat);
    mat4.identity(this.tmp_mat);
}

PoseStylizer.prototype.stylizeSpine = function(array_of_bones, bones_by_name, f)
{
    this.rotateBoneByAngle(array_of_bones, bones_by_name, "mixamorig_Spine", f/50);
    this.rotateBoneByAngle(array_of_bones, bones_by_name, "mixamorig_Spine1", f/100);
    this.rotateBoneByAngle(array_of_bones, bones_by_name, "mixamorig_Spine2", f/100);
    this.rotateBoneByAngle(array_of_bones, bones_by_name, "mixamorig_Neck", f/100);
    this.rotateBoneByAngle(array_of_bones, bones_by_name, "mixamorig_Head", f/75);
}

PoseStylizer.prototype.slerpBone = function(array_of_bones, bones_by_name, name, f, use_tpose_quat)
{
    var index_rshoulder = bones_by_name.get(name);
    var r_shoulder = array_of_bones[index_rshoulder];
    //console.log(r_shoulder.model);

    var trans = vec3.create();
    var scale = vec3.create();
    var r_shoulder_quat = quat.create();
    var aux_q1 = quat.create();
    var aux_q2 = quat.create();
    var temp_mat3 = mat3.create();
    var M = mat4.clone(r_shoulder.model);

    mat4.getScaling(scale, r_shoulder.model);
    mat4.getTranslation(trans, r_shoulder.model);
    var M3 = mat3.fromMat4( temp_mat3, M );
    quat.fromMat3AndQuat( r_shoulder_quat, M3, 2 );
    // quat.fromMat4(r_shoulder_quat, r_shoulder.model);
    // quat.conjugate(r_shoulder_quat,r_shoulder_quat );
    //**************HERE I SHOULD REPLACE  quat.create() BY THE T-POSE QUAT ***********************/
    quat.slerp(aux_q1, this.t_pose_arm_quat, r_shoulder_quat, f/100);
    // quat.slerp(aux_q1, quat.create(), quat.create(), f/100);
    quat.multiply(aux_q2, r_shoulder_quat, aux_q1);
    //reconstruct the matrix
    mat4.fromRotationTranslationScale(this.tmp_mat, aux_q2, trans, scale);
    mat4.copy(r_shoulder.model, this.tmp_mat);
    mat4.identity(this.tmp_mat);
}

function fromRotationTranslationScale(out, q, vec, scale) 
{
    mat4.identity(out);
    mat4.translate(out, out, vec);
    let quatMat = mat4.create();
    mat4.fromQuat(quatMat, q);
    mat4.multiply(out, out, quatMat);
    mat4.scale(out, out, scale)
}

mat4.fromRotationTranslationScale = fromRotationTranslationScale;

PoseStylizer.prototype.stylizeShoulders = function (array_of_bones, bones_by_name, f) 
{
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_RightShoulder", -f*0.65);
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_LeftShoulder", -f*0.65);
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_LeftArm", f*0.15);
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_RightArm", f*0.15);
}

PoseStylizer.prototype.stylizeLegs = function(array_of_bones, bones_by_name, f) 
{
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_RightUpLeg", -f);
    this.slerpBone(array_of_bones, bones_by_name, "mixamorig_LeftUpLeg", -f);
    // this.slerpBone(array_of_bones, bones_by_name, "mixamorig_LeftArm", f*0.25);
    // this.slerpBone(array_of_bones, bones_by_name, "mixamorig_RightArm", f*0.25);
}

PoseStylizer.prototype.applyArmsStyle = function(skeleton, base_anim, k)
{
    /*Loop on the skeleton and if it is not a arm/forearm joint continue */
    /*Inside this, know how much weight of each action apply*/
    /*The emotions can be given by agent properties*/
    /*Remember: More rotation == less amplitude of the arm*/

    var track = base_anim.animation.takes["default"].tracks[k];
    var id_search = skeleton.name + "/" + track._property_path[0];
    if(!id_search.includes("RightArm") && !id_search.includes("LeftArm"))
        return;
    var node = GFX.scene._nodes_by_id[ id_search ];    
    var double_quat = quat.create();
    var half_q = quat.create();
    quat.slerp(half_q, quat.create(), node.rotation, this.body_weights.arms_space);
    quat.multiply(double_quat, node.rotation, half_q);
    node.rotation = double_quat;
    node.updateMatrices();
}

PoseStylizer.prototype.applyShoulderStyle = function(skeleton, base_anim, k, sample)
{

	var track = base_anim.animation.takes["default"].tracks[k];
    var id_search = skeleton.name + "/" + track._property_path[0];
    if(id_search.includes("RightShoulder") || id_search.includes("LeftShoulder"))
	{   
		var node = GFX.scene._nodes_by_id[ id_search ];    
		var double_quat = quat.create();
		var half_q = quat.create();
		quat.slerp(half_q, quat.create(), node.rotation, this.body_weights.shoulders_weight);
		quat.multiply(double_quat, node.rotation, half_q);
		node.rotation = double_quat;
		node.updateMatrices();
	}
    else if(id_search.includes("LeftArm") || id_search.includes("RightArm"))
	{
		var node = GFX.scene._nodes_by_id[ id_search ];    
		var double_quat = quat.create();
		var half_q = quat.create();
		quat.slerp(half_q, quat.create(), node.rotation, this.body_weights.shoulders_weight*(-0.25));
		quat.multiply(double_quat, node.rotation, half_q);
		node.rotation = double_quat;
		node.updateMatrices();
	}
	else
		return;
}

PoseStylizer.prototype.applyLegsStyle = function(skeleton, base_anim, k)
{
    /*Loop on the skeleton and if it is not a arm/forearm joint continue */
    /*Inside this, know how much weight of each action apply*/
    /*The emotions can be given by agent properties*/
    /*Remember: More rotation == bigger footstep and more inclination*/

    var track = base_anim.animation.takes["default"].tracks[k];
    var id_search = skeleton.name + "/" + track._property_path[0];
    if(!id_search.includes("RightUpLeg") && !id_search.includes("LeftUpLeg"))
        return;
    var node = GFX.scene._nodes_by_id[ id_search ];    
    var double_quat = quat.create();
    var half_q = quat.create();
    quat.slerp(half_q, quat.create(), node.rotation, leg_space);
    quat.multiply(double_quat, node.rotation, half_q);
    node.rotation = double_quat;
    node.updateMatrices();
}

//PoseStylizer.prototype.applyArmsWeight = function(skeleton, base_anim, k)
//{
//    /*Loop on the skeleton and if it is not a  joint continue */
//    /*Inside this, know how much weight of each action apply*/
//    /*The emotions can be given by agent properties*/
//
//    var track = base_anim.animation.takes["default"].tracks[k];
//    var id_search = skeleton.name + "/" + track._property_path[0];
//    if( !id_search.includes("Arm")  )
//        return;
//    var node = GFX.scene._nodes_by_id[ id_search ];
//
//    var node_gpos = node.getGlobalPosition();
//    var node_downpos = [node_gpos[0],node_gpos[1]-10, node_gpos[2]]; 
//    var childnode_gpos = node.children[0].getGlobalPosition();
//
//    var down_vec = vec3.create();   // vector to the floor
//    var child_vec = vec3.create();  
//
//    vec3.subtract(down_vec, node_downpos, node_gpos);
//    vec3.subtract(child_vec, childnode_gpos, node_gpos);    //vector to the following joint
//
//    vec3.normalize(down_vec, down_vec);
//    vec3.normalize(child_vec, child_vec);
//
//    // GFX.drawDebugLine([ node_gpos, childnode_gpos, node_gpos, node_downpos  ], "debugg" + k);
//    
//    var angle = vec3.angle(child_vec, down_vec);    // angle to achieve the down orientation
//    var axis = vec3.create();                       
//    vec3.cross(axis, child_vec, down_vec); 
//    vec3.normalize(axis,axis);         // axis to rotate
//    var fromaxis = quat.fromAxisAngle(axis, angle);
//    var final_quat = quat.create();
//    quat.rotateToFrom(final_quat, child_vec, [0,-1,0]);
//    quat.multiply(final_quat, node.rotation, final_quat);
//    // quat.slerp(final_quat, final_quat, node.rotation, arms_weight);
//    // var q2 = quat.fromAxisAngle([0,1,0], getTime()*0.001)
//    node.rotation = final_quat;
//    node.updateMatrices();
//
//    // this.computeAngle(node);
//}

PoseStylizer.prototype.computeAngle = function(node)
{
    var node_gpos = node.getGlobalPosition();
    var node_downpos = [node_gpos[0],node_gpos[1]-10, node_gpos[2]]; 
    var childnode_gpos = node.children[0].getGlobalPosition();

    var down_vec = vec3.create();   // vector to the floor
    var child_vec = vec3.create();  

    vec3.subtract(down_vec, node_downpos, node_gpos);
    vec3.subtract(child_vec, childnode_gpos, node_gpos);    //vector to the following joint

    vec3.normalize(down_vec, down_vec);
    vec3.normalize(child_vec, child_vec);

    // GFX.drawDebugLine([ node_gpos, childnode_gpos, node_gpos, node_downpos  ], "debugg" + k);
    
    var angle = vec3.angle(child_vec, down_vec);    // angle to achieve the down orientation
    console.log("Postrotation", angle);
}
