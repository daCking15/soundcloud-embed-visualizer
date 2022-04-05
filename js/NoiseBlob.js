var NoiseBlob = function(_renderer, _analyzer, _light){ 
  this.is_init = false;
  this.show_hdr = true;

  this.renderer = _renderer;
  this.audio_analyzer = _analyzer;
  this.light = _light;

  this.w = _renderer.w;
  this.h = _renderer.h;

  this.init_texture();
  this.init_shader();
  this.init_scene();
  this.init_cubemap();
};

NoiseBlob.prototype.update = function(){ 
  var _shdrs = [
      this.shdr_mesh, 
      this.shdr_wire, 
      this.shdr_points, 
      this.shdr_pop_points, 
      this.shdr_pop_wire, 
      this.shdr_pop_points_out, 
      this.shdr_pop_wire_out, 
      this.shdr_shadow
  ];
  var _shdrs_size = _shdrs.length;
  for(var i = 0; i < _shdrs_size; i++){
      _shdrs[i].uniforms.u_is_init.value = this.is_init;
      _shdrs[i].uniforms.u_t.value = this.timer;
      
      _shdrs[i].uniforms.u_audio_high.value = this.audio_analyzer.get_high();
      _shdrs[i].uniforms.u_audio_mid.value = this.audio_analyzer.get_mid();
      _shdrs[i].uniforms.u_audio_bass.value = this.audio_analyzer.get_bass();
      _shdrs[i].uniforms.u_audio_level.value = this.audio_analyzer.get_level();
      _shdrs[i].uniforms.u_audio_history.value = this.audio_analyzer.get_history();
  }

  // this.update_shadow_map();
  this.update_cubemap();

  var _cam = this.renderer.get_camera();
  this.renderer.renderer.render( this.scene, _cam);

  if(!this.is_init){ 
      this.is_init = true;

      console.log("NoiseBlob : is initiated");
  }

  this.timer = this.renderer.get_timer();
};

NoiseBlob.prototype.update_shadow_map = function(){
  var _shadow_cam = this.light.get_light();
  var _shdow_fbo = this.light.get_shadow_frame_buffer();

  this.renderer.renderer.render(this.shadow_scene, _shadow_cam, _shdow_fbo);

  var _light_pos = this.light.get_light_pos();
  _light_pos.applyMatrix4(this.renderer.matrix.modelViewMatrix);
  
  var _shadow_matrix = new THREE.Matrix4();
  _shadow_matrix.identity();
  _shadow_matrix.multiplyMatrices ( 
      this.light.get_light().projectionMatrix, 
      this.light.get_light().modelViewMatrix );

  this.shdr_mesh.uniforms.u_light_pos.value = _light_pos;
  this.shdr_mesh.uniforms.u_shadow_matrix.value = _shadow_matrix;
  this.shdr_mesh.uniforms.u_shadow_map.value = this.light.get_shadow_map();
};

NoiseBlob.prototype.init_shader = function(){
  var screen_res = 'vec2( ' + this.w.toFixed( 1 ) +', ' + this.h.toFixed( 1 ) + ')';
  
  function load(_vert, _frag){
      return new THREE.ShaderMaterial( 
      { 
          defines: {
              SCREEN_RES: screen_res
          },
          uniforms: {
              u_t: {value: 0},
              u_is_init: {value: false},
              u_audio_high: {value: 0.},
              u_audio_mid: {value: 0.},
              u_audio_bass: {value: 0.},
              u_audio_level: {value: 0.},
              u_audio_history: {value: 0.}
          },
          vertexShader:   _vert,
          fragmentShader: _frag
      });
  };

  this.shdr_cubemap = new THREE.ShaderMaterial( 
      { 
          defines: {
              SCREEN_RES: screen_res
          },
          uniforms: {
              u_cubemap: {value: this.cubemap},
              u_cubemap_b: {value: this.cubemap_b},
              u_exposure: {value: 2.},
              u_gamma: {value: 2.2}
          },
          vertexShader:   skybox_vert,
          fragmentShader: skybox_frag
      });

  // scene shdr
  this.shdr_mesh = load(blob_vert, blob_frag);
  this.shdr_wire = load(blob_vert, blob_frag);
  this.shdr_points = load(blob_vert, blob_frag);
  this.shdr_shadow = load(blob_vert, blob_frag);
  this.shdr_pop_points = load(blob_vert, blob_frag);
  this.shdr_pop_wire = load(blob_vert, blob_frag);
  this.shdr_pop_points_out = load(blob_vert, blob_frag);
  this.shdr_pop_wire_out = load(blob_vert, blob_frag);

  this.shdr_mesh.extensions.derivatives = true;

  this.shdr_mesh.defines.IS_MESH = 'true';
  this.shdr_mesh.defines.HAS_SHADOW = 'true';
  this.shdr_wire.defines.IS_WIRE = 'true';
  this.shdr_points.defines.IS_POINTS = 'true';
  this.shdr_shadow.defines.IS_SHADOW = 'true';
  this.shdr_pop_points.defines.IS_POINTS = 'true';
  this.shdr_pop_points.defines.IS_POP = 'true';
  this.shdr_pop_wire.defines.IS_WIRE = 'true';
  this.shdr_pop_wire.defines.IS_POP = 'true';
  this.shdr_pop_points_out.defines.IS_POINTS = 'true';
  this.shdr_pop_points_out.defines.IS_POP_OUT = 'true';
  this.shdr_pop_wire_out.defines.IS_WIRE = 'true';
  this.shdr_pop_wire_out.defines.IS_POP_OUT = 'true';

  var _light_pos = this.light.get_light_pos();
  _light_pos.applyMatrix4(this.renderer.matrix.modelViewMatrix);
  
  var _shadow_matrix = new THREE.Matrix4();
  _shadow_matrix.identity();
  _shadow_matrix.multiplyMatrices ( 
      this.light.get_light().projectionMatrix, 
      this.light.get_light().modelViewMatrix );

  this.shdr_mesh.uniforms.u_light_pos = {value: _light_pos};
  this.shdr_mesh.uniforms.u_shadow_matrix = {value: _shadow_matrix};
  this.shdr_mesh.uniforms.u_shadow_map = {value: this.light.get_shadow_map()};
  this.shdr_mesh.uniforms.u_debug_shadow = {value: false};
  this.shdr_points.uniforms.tex_sprite = {value: this.tex_sprite};
  this.shdr_pop_points.uniforms.tex_sprite = {value: this.tex_sprite};
  this.shdr_pop_wire.uniforms.tex_sprite = {value: this.tex_sprite};
  this.shdr_pop_points_out.uniforms.tex_sprite = {value: this.tex_sprite};
  this.shdr_pop_wire_out.uniforms.tex_sprite = {value: this.tex_sprite};
  
  this.shdr_points.blending = THREE.AdditiveBlending;
  this.shdr_wire.blending = THREE.AdditiveBlending;
  this.shdr_pop_points.blending = THREE.AdditiveBlending;
  this.shdr_pop_wire.blending = THREE.AdditiveBlending;
  this.shdr_pop_points_out.blending = THREE.AdditiveBlending;
  this.shdr_pop_wire_out.blending = THREE.AdditiveBlending;
  
  this.shdr_wire.transparent = true;
  this.shdr_points.transparent = true;
  this.shdr_pop_points.transparent = true;
  this.shdr_pop_wire.transparent = true;
  this.shdr_pop_points_out.transparent = true;
  this.shdr_pop_wire_out.transparent = true;


  this.shdr_wire.depthTest = false;
  this.shdr_points.depthTest = false;
  this.shdr_pop_points.depthTest = false;
  this.shdr_pop_wire.depthTest = false;
  this.shdr_pop_points_out.depthTest = false;
  this.shdr_pop_wire_out.depthTest = false;
};

NoiseBlob.prototype.init_texture = function(){
  this.tex_sprite = new THREE.TextureLoader().load( "assets/sprite_additive_rect.png" );
  this.tex_sprite.wrapS = THREE.ClampToEdgeWrapping;
  this.tex_sprite.wrapT = THREE.ClampToEdgeWrapping;
  this.tex_sprite.magFilter = THREE.LinearFilter;
  this.tex_sprite.minFilter = THREE.LinearFilter;
};

NoiseBlob.prototype.init_scene = function(){
  var _sphere_size = .7;
  var _geom = new THREE.SphereBufferGeometry(_sphere_size, 128, 128);
  var _geom_lowres = new THREE.SphereBufferGeometry(_sphere_size, 64, 64);

  this.scene = new THREE.Scene();
  this.shadow_scene = new THREE.Scene();

  var _mesh = new THREE.Mesh(_geom, this.shdr_mesh);
  var _wire = new THREE.Line(_geom_lowres, this.shdr_wire);
  var _points = new THREE.Points(_geom, this.shdr_points);
  var _shadow_mesh = new THREE.Mesh(_geom, this.shdr_shadow);

  var _pop_points = new THREE.Points(_geom_lowres, this.shdr_pop_points);
  var _pop_wire = new THREE.Line(_geom_lowres, this.shdr_pop_wire);

  var _pop_points_out = new THREE.Points(_geom_lowres, this.shdr_pop_points_out);
  var _pop_wire_out = new THREE.Line(_geom_lowres, this.shdr_pop_wire_out);
  
  this.scene.add(_mesh);
  this.scene.add(_wire);
  this.scene.add(_points);

  this.scene.add(_pop_points);
  this.scene.add(_pop_wire);
  this.scene.add(_pop_points_out);
  this.scene.add(_pop_wire_out);

  this.shadow_scene.add(_shadow_mesh);

  var _geom_cube = new THREE.BoxBufferGeometry(100, 100, 100);
  var _mesh_cube = new THREE.Mesh(_geom_cube, this.shdr_cubemap);

  var mS = (new THREE.Matrix4()).identity();
  mS.elements[0] = -1;
  mS.elements[5] = -1;
  mS.elements[10] = -1;

  _geom_cube.applyMatrix(mS);

  this.scene.add(_mesh_cube);

  var loader = new THREE.TextureLoader();

  //Cover Art
  console.log("sXlXcXn M1");
  var material1 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/m1.jpg')
  });
  material1.side = THREE.DoubleSide;
  var geometry1 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh1 = new THREE.Mesh(geometry1, material1);
  mesh1.position.set(0,-3,0);
  mesh1.scale.set(0.6,0.6,0.6);
  mesh1.quaternion.set(0.7071068, 0, 0, 0.7071068);
  this.scene.add(mesh1);
  console.log(mesh1);

  //Pushin C
  console.log("Pushin C");
  var material2 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Pushin C.jpg')
  });
  material2.side = THREE.DoubleSide;
  var geometry2 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh2 = new THREE.Mesh(geometry2, material2);
  mesh2.position.set(0,0,-20);
  mesh2.scale.set(0.6,0.6,0.6);
  this.scene.add(mesh2);
  console.log(mesh2);

  //Martyr
  console.log("Martyr");
  var material3 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Martyr.jpg')
  });
  material3.side = THREE.DoubleSide;
  var geometry3 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh3 = new THREE.Mesh(geometry3, material3);
  mesh3.position.set(10,0,-14);
  mesh3.scale.set(0.6,0.6,0.6);
  mesh3.quaternion.set(0, -0.258819, 0, 0.9659258);
  this.scene.add(mesh3);
  console.log(mesh3);

  //RIP Brotha Mane
  console.log("RIP Brotha Mane");
  var material4 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/RIP Brotha Mane.jpg')
  });
  material4.side = THREE.DoubleSide;
  var geometry4 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh4 = new THREE.Mesh(geometry4, material4);
  mesh4.position.set(14,0,-7);
  mesh4.scale.set(0.6,0.6,0.6);
  mesh4.quaternion.set(0, -0.5, 0, 0.8660254);
  this.scene.add(mesh4);
  console.log(mesh4);

  //Indigo Child
  console.log("Indigo Child");
  var material5 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Indigo Child.jpg')
  });
  material5.side = THREE.DoubleSide;
  var geometry5 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh5 = new THREE.Mesh(geometry5, material5);
  mesh5.position.set(20,0,0);
  mesh5.scale.set(0.6,0.6,0.6);
  mesh5.quaternion.set(0, -0.7071068, 0, 0.7071068);
  this.scene.add(mesh5);
  console.log(mesh5);

  //Red Sky
  console.log("Red Sky");
  var material6 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Red Sky.jpg')
  });
  material6.side = THREE.DoubleSide;
  var geometry6 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh6 = new THREE.Mesh(geometry6, material6);
  mesh6.position.set(10,0,10);
  mesh6.scale.set(0.6,0.6,0.6);
  mesh6.quaternion.set(0, -0.9238795, 0, 0.3826834);
  this.scene.add(mesh6);
  console.log(mesh6);

  //Feed Me Adversity
  console.log("Feed Me Adversity");
  var material7 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Feed Me Adversity.png')
  });
  material7.side = THREE.DoubleSide;
  var geometry7 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh7 = new THREE.Mesh(geometry7, material7);
  mesh7.position.set(0,0,20);
  mesh7.scale.set(0.6,0.6,0.6);
  mesh7.quaternion.set(0, -1, 0, 0);
  this.scene.add(mesh7);
  console.log(mesh7);

  //Trap Back
  console.log("Trap Back");
  var material8 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Trap Back.jpg')
  });
  material8.side = THREE.DoubleSide;
  var geometry8 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh8 = new THREE.Mesh(geometry8, material8);
  mesh8.position.set(-10,0,10);
  mesh8.scale.set(0.6,0.6,0.6);
  mesh8.quaternion.set(0, -0.9238795, 0, -0.3826834);
  this.scene.add(mesh8);
  console.log(mesh8);

  //Inflection Point
  console.log("Inflection Point");
  var material9 = new THREE.MeshLambertMaterial({
    map: loader.load('assets/Cover Art/Inflection Point.jpg')
  });
  material9.side = THREE.DoubleSide;
  var geometry9 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh9 = new THREE.Mesh(geometry9, material9);
  mesh9.position.set(-20,0,0);
  mesh9.scale.set(0.6,0.6,0.6);
  mesh9.quaternion.set(0, -0.7071068, 0, -0.7071068);
  this.scene.add(mesh9);
  console.log(mesh9);

  //It's What It Is
  console.log("It's What It Is");
  var material10 = new THREE.MeshLambertMaterial({
    map: loader.load("assets/Cover Art/It's What It Is.png")
  });
  material10.side = THREE.DoubleSide;
  var geometry10 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh10 = new THREE.Mesh(geometry10, material10);
  mesh10.position.set(-14,0,-7);
  mesh10.scale.set(0.6,0.6,0.6);
  mesh10.quaternion.set(0, -0.5, 0, -0.8660254);
  this.scene.add(mesh10);
  console.log(mesh10);

  //Track 11
  console.log("Chris Rocked");
  var material11 = new THREE.MeshLambertMaterial({
    map: loader.load("assets/Cover Art/Chris Rocked.png")
  });
  material11.side = THREE.DoubleSide;
  var geometry11 = new THREE.PlaneGeometry(10, 10*.75);
  var mesh11 = new THREE.Mesh(geometry11, material11);
  mesh11.position.set(-7,0,-14);
  mesh11.quaternion.set(0, -0.258819, 0, -0.9659258);
  this.scene.add(mesh11);
  console.log(mesh11);

  // Add a point light with #fff color, .7 intensity, and 0 distance
  var light = new THREE.PointLight( 0xffffff, 1, 0 );
  light.position.set(0, 0, 0 );
  this.scene.add(light);
  console.log(light);

};

NoiseBlob.prototype.set_retina = function(){
  this.w *= .5;
  this.h *= .5;
};

NoiseBlob.prototype.init_cubemap = function(){
  var _path = "assets/";
  var _format = '.jpg';
  var _urls = [
      _path + 'px_3js' + _format, _path + 'nx_3js' + _format,
      _path + 'py_3js' + _format, _path + 'ny_3js' + _format,
      _path + 'pz_3js' + _format, _path + 'nz_3js' + _format
  ];
  
  this.cubemap = new THREE.CubeTextureLoader().load( _urls );
  this.cubemap.format = THREE.RGBFormat;

  _urls = [
      _path + 'px' + _format, _path + 'nx' + _format,
      _path + 'py' + _format, _path + 'ny' + _format,
      _path + 'pz' + _format, _path + 'nz' + _format
  ];

  this.cubemap_b = new THREE.CubeTextureLoader().load( _urls );
  this.cubemap_b.format = THREE.RGBFormat;

  this.shdr_mesh.uniforms.cubemap = {value: this.cubemap};
  this.shdr_cubemap.uniforms.u_cubemap.value = this.cubemap;
  this.shdr_mesh.uniforms.cubemap_b = {value: this.cubemap_b};
  this.shdr_cubemap.uniforms.u_cubemap_b.value = this.cubemap_b;
  this.shdr_cubemap.uniforms.u_show_cubemap = {value:this.show_hdr};
  this.shdr_mesh.defines.HAS_CUBEMAP = 'true';
};

NoiseBlob.prototype.toggle_cubemap = function(){
  this.shdr_cubemap.uniforms.u_show_cubemap.value = this.show_hdr;
};

NoiseBlob.prototype.update_cubemap = function(){
  // var _cross_fader = (Math.sin(this.audio_analyzer.get_history()) + 1.) / 2.;
  var _cross_fader = 0.;
  // var _cross_fader = 1.-this.audio_analyzer.get_level();
  this.shdr_mesh.uniforms.cross_fader = {value:_cross_fader};
  this.shdr_cubemap.uniforms.cross_fader = {value:_cross_fader};

  this.shdr_cubemap.uniforms.u_exposure.value = this.pbr.get_exposure();
  this.shdr_cubemap.uniforms.u_gamma.value = this.pbr.get_gamma();
};

NoiseBlob.prototype.set_PBR = function(_pbr){
  this.pbr = _pbr;

  this.shdr_mesh.uniforms.tex_normal = {value: this.pbr.get_normal_map()};
  this.shdr_mesh.uniforms.tex_roughness = {value: this.pbr.get_roughness_map()};
  this.shdr_mesh.uniforms.tex_metallic = {value: this.pbr.get_metallic_map()};
  
  this.shdr_mesh.uniforms.u_normal = {value: this.pbr.get_normal()};
  this.shdr_mesh.uniforms.u_roughness = {value: this.pbr.get_roughness()};
  this.shdr_mesh.uniforms.u_metallic = {value: this.pbr.get_metallic()};
  
  this.shdr_mesh.uniforms.u_exposure = {value: this.pbr.get_exposure()};
  this.shdr_mesh.uniforms.u_gamma = {value: this.pbr.get_gamma()};

  this.shdr_mesh.uniforms.u_view_matrix_inverse = {value: this.renderer.get_inversed_matrix()};

  this.shdr_mesh.defines.IS_PBR = 'true';
};

NoiseBlob.prototype.update_PBR = function(){
  this.shdr_mesh.uniforms.u_normal.value = this.pbr.get_normal();
  this.shdr_mesh.uniforms.u_roughness.value = this.pbr.get_roughness();
  this.shdr_mesh.uniforms.u_metallic.value = this.pbr.get_metallic();
  
  this.shdr_mesh.uniforms.u_exposure.value = this.pbr.get_exposure();
  this.shdr_mesh.uniforms.u_gamma.value = this.pbr.get_gamma();

  this.shdr_mesh.uniforms.u_view_matrix_inverse.value = this.renderer.get_inversed_matrix();
};

NoiseBlob.prototype.debug_shadow_map = function(_show){
  this.shdr_mesh.uniforms.u_debug_shadow.value = _show;
};