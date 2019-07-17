<?php
    ini_set('display_errors', 'On');
    error_reporting(E_ALL | E_STRICT);

    
    $uri = pathinfo('https://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF']);
    $uri = $uri['dirname'];

    function getDirContents($dir, &$results = array()){
        $files = scandir($dir);
        $uri = pathinfo($_SERVER['PHP_SELF']);
        $uri = $uri['dirname'];
    
        foreach($files as $key => $value){

            if($value == "allfiles.php") continue;

            $a = str_replace($uri, "", $dir);
            $a = str_replace("/mnt/vmdata/webglstudio/var/www/", "", $a);
            
            $path = realpath($dir.DIRECTORY_SEPARATOR.$value);
            if(!is_dir($path)) {
                if($a != ".")
                    $results[] = $a.DIRECTORY_SEPARATOR.$value;
                else
                    $results[] = $value;
            } else if($value != "." && $value != ".." ) {
                getDirContents($path, $results);
            }
        }
    
        return $results;
    }

    getDirContents('.',$files[]);

    header('Content-Type: application/fetch');
    echo json_encode($files[0]);
?>