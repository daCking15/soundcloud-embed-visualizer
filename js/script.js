var m_analyzer;
var m_renderer;
// var m_mouse;
var m_render_queue;
var m_blob;
var m_pbr;
var m_light;
var m_ctrl;
var m_device_checker;

var revealed = true;
var transitionFinished = false;

var landscapeHidden = function(){

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    canvas.style["margin-left"] = "0px";

    iFrame.width = "0";
    iFrame.height = window.innerHeight;
    iFrame.style.height = window.innerHeight + "px";
    iFrame.style.width = "0px";
    iFrame.style["margin-top"] = "0px";

    button.style.left = "0px";
    button.style.top = "calc(50% - 25px)";
    button.style.transform = "rotate(180deg)";

}

var landscapeReveal = function(){

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");
    
    canvas.width = (3/4)*window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    canvas.style["margin-left"] = "25%";

    iFrame.width = (1/4)*window.innerWidth;
    iFrame.height = window.innerHeight;
    iFrame.style.height = window.innerHeight + "px";
    iFrame.style.width = (1/4)*window.innerWidth + "px";
    iFrame.style["margin-top"] = "0px";

    button.style.left = "25%";
    button.style.top = "calc(50% - 25px)";
    button.style.transform = "rotate(0deg)";

}

var portraitHidden = function(){

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.style.height = canvas.height + "px";
    canvas.style.width = canvas.width + "px";
    canvas.style["margin-left"] = "0px";

    iFrame.width = window.innerWidth;
    iFrame.style.width = iFrame.width + "px";
    iFrame.style["margin-top"] = "100%";

    button.style.top = "calc(100% - 50px)";
    button.style.left = "calc(50% - 25px)";
    button.style.transform = "rotate(90deg)";

}

var portraitReveal = function(){

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");

    canvas.height = (1/4)*window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.style.height = canvas.height + "px";
    canvas.style.width = canvas.width + "px";
    canvas.style["margin-left"] = "0px";

    iFrame.height = (3/4)*window.innerHeight;
    iFrame.width = window.innerWidth;
    iFrame.style.width = iFrame.width + "px";
    iFrame.style.height = iFrame.height + "px";
    iFrame.style["margin-top"] = (1/4)*window.innerHeight+"px";

    button.style.top = "calc(25% - 50px)";
    button.style.left = "calc(50% - 25px)";
    button.style.transform = "rotate(-90deg)";

}

var reveal = function(){

    console.log("Reveal");

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");

    canvas.style.transition = "margin-left 2s ease 0s, width 2s ease 0s, height 1s ease 0s";
    iFrame.style.transition = "width 2s ease 0s, height 2s ease 0s, margin-top 2s ease 0s";
    button.style.transition = "left 2s ease 0s, top 1.5s ease 0s";

    //Portrait
    if (window.innerHeight > window.innerWidth){

        //Unreveal
        if (revealed){ portraitHidden(); }

        //Reveal
        else{ portraitReveal(); }
    }

    //Landscape
    else{

        //Unreveal
        if (revealed){ landscapeHidden(); }

        //Reveal
        else{ landscapeReveal(); }
    }

    revealed = !revealed

}

var init = function(){

    console.log(window);

    // device_checker
    m_device_checker = new DeviceChecker();
    var _is_mobile = m_device_checker.is_mobile();
    var _is_retina = m_device_checker.is_retina();

    // init audio input analyzer
    m_analyzer = new AudioAnalyzer();
    // init mouse handler
    // m_mouse = new MouseHandler();
    // m_mouse.register_dom_events(document.body);
    
    // init shared renderer
    var _is_perspective = true;
    m_renderer = new ThreeSharedRenderer(_is_perspective);
    m_renderer.append_renderer_to_dom(document.body);
    m_renderer.renderer.autoClear = true;

    // init pbr
    m_pbr = new ThreePBR();
    // init light
    m_light = new ThreePointLight();

    // init blob
    m_blob = new NoiseBlob(m_renderer, m_analyzer, m_light);
    m_blob.set_PBR(m_pbr);
    if(_is_retina) m_blob.set_retina();
    
    // setup render queue
    m_render_queue = [
        m_blob.update.bind(m_blob)
    ];

    // init gui
    m_ctrl = new Ctrl(m_blob, m_light, m_pbr, m_analyzer);

    console.log("v1.02.2: Switch Between Portrait & Landscape");

    var button = document.getElementById("reveal");
    button.onclick = reveal;


    //Portrait
    if (window.innerHeight > window.innerWidth){ portraitReveal(); }

    //Landscape
    else{ landscapeReveal(); }

};


var update = function(){

    //Transition
    var transition = document.getElementById("transition");
    if (transition.style.opacity > 0){
        transition.style.opacity -= 0.01;
    }else if (!transitionFinished){
        transition.style.opacity = 0;
        transition.style["z-index"] = -1000;
        transitionFinished = false
    }

    var canvas = document.getElementsByTagName("canvas")[0];
    var iFrame = document.getElementsByTagName("iframe")[0];
    var button = document.getElementById("reveal");

    canvas.style["z-index"] = -1;

    //Portrait
    if (window.innerHeight > window.innerWidth){

        //Keep Revealed
        if (revealed){ portraitReveal(); }

        //Keep Hidden
        else{ portraitHidden(); }

    }

    //Landscape
    else {

        //Keep Revealed
        if (revealed){ landscapeReveal(); }

        //Keep Hidden
        else{ landscapeHidden(); }

    }

    var resizeEvent = window.document.createEvent('UIEvents'); 
    resizeEvent.initUIEvent('resize', true, false, window, 0); 
    window.dispatchEvent(resizeEvent);

    requestAnimationFrame( update );

    // update audio analyzer
    m_analyzer.update();
    // m_analyzer.debug(document.getElementsByTagName("canvas")[0]);

    // update blob
    m_blob.update_PBR();

    // update pbr
    m_pbr.exposure = 5. 
        + 30. * m_analyzer.get_level();

    // update light
    // if(m_ctrl.params.light_ziggle) 
    //     m_light.ziggle( m_renderer.timer );

    // update renderer
    if(m_ctrl.params.cam_ziggle) 
        m_renderer.ziggle_cam(m_analyzer.get_history());
    m_renderer.render(m_render_queue);

};


document.addEventListener('DOMContentLoaded', function(){
    if(window.location.protocol == 'http:' && window.location.hostname != "localhost"){
        window.open("https://" + window.location.hostname + window.location.pathname,'_top');
    } else {
        init();
        update();
    }
});