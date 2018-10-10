//A general node could be understood as a selector, as it
//iterates through his children and if one succeeds, the selector succeeds
//but if one fails, goes through the next children
class Node{
    constructor(){
        // this.uid = count++;
        this.blackboard = blackboard;
        this.children = [];
        this.conditional_expression = null;
        this.n = null;
        this.parameters = {};

        this.tick = function(agent){
            
            for(var n in this.children){
                let child = this.children[n];
                var value = child.tick(agent);
                //Value debería ser success, fail, o running
                if(value){
                    return value;
                }
            }
            console.log("Ninguna rama ha tenido exito");
            return false; //placeholder hasta que lo pensemos bien
        }
    }

    addConditional( conditional ){
        this.conditional_expression = conditional;
    }

    addFunctionality( functionality ){
        this.execute = functionality;
    }

    addChildren(node){
        this.children.push(node);
    }

    onChildrenDrag( e, node){
        //sort children in X axis
        array.sort;
    }

}

