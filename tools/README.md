Unity Proto-scene Exporter
==========================

This packackage wraps a series of scripts designed to create different paths into a unity scene and export that information into a json.

1. Import the package into your project.
2. Set the paths (the movement is only prototypic)
3. Scene whiteboxing using boxes, spheres and capsules
4. Create a new layer and put all the whiteboxing inside that layer
5. Select the ProtoSceneExporter (is an empty gameobject with a script )
    1. Press refresh list
    2. Be sure the JSON File field is pointing to a json asset (does not matter its contents, will be erased)
    3. Press Export ProtoScene to fill the json