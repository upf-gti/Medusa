var INFO = 
{
    nodes:
    {
        composites:
        {
            selector:
            {
                name:"Selector", 
                description:"The Selector node will tick one by one its children, starting by the left one (as in this system the most priority nodes are placed on the left). In case one of its children succeeds, it will return the resultant behaviour to its parent node. In case it fails, it will evaluate the following children until one succeeds. If the last children fails, the execution of the Selector fails, and return the fail status to its parent. In case one if its children returns a running state, it will save that node, and in the following iteration, it will execute that node, as its task was not finished. This running task can only be interrupted by other branch (upper to the selector node) which has more priority. "
            }, 
            sequencer: 
            {
                name:"Sequencer", 
                description:"A Sequencer Node will tick all of its children one by one, and if some of them return fail, it will return fail to its parent. The Sequencer just succeeds only if all of its children succeed. In case one of its children return a running status, it will do the same as the selector node: save the running child for the next iteration, and execute it directly without executing previous children. "
            }, 
            random_selector:
            {
                name:"RandomSelector", 
                description:"The RandomSelector node works equally to the Selector, with the difference that, instead of executing the first child, then the second, and so on, it will execute a random child, and will not change that random value in a period (customizable through the widget). Once the period ends, it will execute another random child. The success/fail status works as in the Selector. "
            }, 
        }, 

        decorators:
        {
            conditional:
            {
                name:"Conditional", 
                description:"This type of node is a basic Conditional node which takes into account a threshold set up (and customizable anytime) inside the node properties, and an external input. This input value can come from an HBTProperty Node, or any other node which outputs a numeric value. The comparison type can be selected through the inner widgets of the node. In case the comparison succeeds, children nodes of the Conditional node will be ticked and evaluated. In case the comparison fails, it will return a fail status to its parent. "

            }, 
            bool_conditional: 
            {
                name:"BoolConditional", 
                description:"The BoolConditional node is separated from the ConditionalNode due to design purposes. It works the same way than the previous one, bun the widgets embedded inside the node are different. It is possible to set up if we want the comparison to succeed in case the input value is true or false."
            }, 
            line_of_sight:
            {
                name:"LineOfSight", 
                description:"The LineOfSight Node computes the angle between the front direction of the agent and a target where it has to look at. In case the angle is inside a range, set up in the embedded widget, it will tick its children as the conditions has been passed. If not it  will return fail status. The target used to compute the angle is set from a flow input, where the target evaluated is passed through. "
            }, 
        }, 

        tasks:
        {
            simple_animate:
            {
                name:"SimpleAnimate", 
                description:"The SimpleAnimate node builds and returns a behaviour with the following information: animation to play, speed of the animation, and motion speed of the animation, in case it is a locomotion animation. It is commonly used for cyclic animations such as idle, walking or running. It has not a specific duration, so it will be executed as many times as it is reached."
            }, 
            action_animate: 
            {
                name:"ActionAnimate", 
                description:"The ActionAnimate node builds and returns a behaviour with the following information: animation to play and speed of the animation. In this case we should not apply the motion, as the action has to move itself according to the gesture. It has a time of reproduction, so it will stay at running status the time set up in the embedded widget. "
            }, 
            wait:
            {
                name:"Wait", 
                description:"When a Wait node is ticked, it pauses the execution of the branch the time set up in the embedded widget. In case a more priority branch succeeds, it is reinitialized and this branch gets unblocked."
            }, 
            patrol:
            {
                name:"Patrol", 
                description:"The Patrol node builds and returns a behaviour containing the message patrol, and success status."
            }, 
            move_to_location: 
            {
                name:"MoveToLocation", 
                description:"The MoveToLocation node builds and returns a behaviour containing the target position of the agent which is evaluating the tree. The target position is set up through the flow input of the node.  It does not succeed until the target position is reached. Thus, it blocks the branch in this node so the next iteration starts executing it and checking if it is in the target. In that case, it will return the success status and unblock that branch."
            }, 
            look_at:
            {
                name:"LookAt", 
                description:"The LookAt node builds and returns a behaviour containing the target position where the agent which is evaluating the tree has to look at. The look_at target is set through the flow input of the node. "
            }, 
        }, 

        eqs:
        {
            eqs_nip:
            {
                name:"EQSNearestInterestPoint", 
                description:"Blablabla"
            }, 
            eqs_na: 
            {
                name:"EQSNearestAgent", 
                description:"Blablabla"
            }, 
            eqs_dt:
            {
                name:"EQSDistanceTo", 
                description:"Blablabla"
            }, 
        },

        hbtproperty:
        {
            hbtproperty:
            {
                name:"HBTProperty", 
                description: "BlBEubEI"
            }
        }
    }, 

}