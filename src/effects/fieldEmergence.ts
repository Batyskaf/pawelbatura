import * as T from 'three';
import type { EffectTarget, Exhibit, Settings } from '../types';
import { activationState, progressStep } from './materialization';

// An artistic field-superposition model; not a simulation of quantum mechanics.
export class FieldEmergence {
  phase = 0; reveal = 0; critical = false; active = false;
  readonly criticalThreshold = .84;
  private time = { value: 0 }; private fieldPhase = { value: 0 }; private walls = { value: 0 }; private frames = { value: 0 }; private pictures = { value: 0 };
  private fieldGroup = new T.Group(); private wireUniforms: { phase: { value: number }; time: { value: number }; tint: { value: T.Color }; offset: { value: number } }[] = [];
  private bounds = new T.Box3(new T.Vector3(-9, 0, -34), new T.Vector3(9, 6.7, -18));
  private nearest = new T.Vector3(); private lastCritical = false;
  constructor(scene: T.Scene, public targets: EffectTarget[], public exhibits: Exhibit[]) {
    for (const target of targets) target.object.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      this.bindForm(object, this.walls);
    });
    for (const exhibit of exhibits) {
      exhibit.group.traverse(object => {
        if (object instanceof T.Mesh && object !== exhibit.image) this.bindForm(object, this.frames);
      });
      const material = (exhibit.image.material as T.MeshBasicMaterial).clone();
      material.onBeforeCompile = shader => {
        shader.uniforms.uPictureReveal = this.pictures;
        shader.vertexShader = 'varying vec2 vPictureUv;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPictureUv = uv;');
        shader.fragmentShader = 'uniform float uPictureReveal; varying vec2 vPictureUv;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec2 cell = floor(vPictureUv * 90.0);
          float grain = fract(sin(dot(cell, vec2(12.9898,78.233))) * 43758.5453);
          float emergence = length((vPictureUv - .5) * 1.4) * .7 + grain * .3;
          if (emergence > uPictureReveal) discard;`);
      };
      material.customProgramCacheKey = () => 'critical-picture-emergence'; exhibit.image.material = material; exhibit.image.visible = false;
    }
    this.fieldGroup.position.set(0, 2.8, -26); this.fieldGroup.name = 'overlapping-topological-fields'; scene.add(this.fieldGroup);
    const geometry = new T.SphereGeometry(5.5, 48, 28);
    for (let i = 0; i < 3; i++) {
      const uniforms = { phase: this.fieldPhase, time: this.time, tint: { value: new T.Color(['#7fd3c0', '#91b6e1', '#d2bd89'][i]) }, offset: { value: i * 2.094 } };
      this.wireUniforms.push(uniforms);
      const material = new T.ShaderMaterial({
        uniforms, transparent: true, wireframe: true, depthWrite: false, toneMapped: false,
        vertexShader: `uniform float phase; uniform float time; uniform float offset; varying float vWave;
          void main(){
            vec3 p=position;
            float a=sin(length(p-vec3(-2.0,0.0,1.0))*2.1-time*.8+offset);
            float b=sin(length(p-vec3(2.0,1.0,-1.0))*2.7+time*.6-offset);
            float c=sin((p.x+p.z)*1.4+time*.45+offset);
            float field=(a+b+c)/3.0;
            float envelope=1.0-smoothstep(.45,.95,phase);
            p+=normal*field*.8*envelope;
            vWave=field;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
          }`,
        fragmentShader: `uniform vec3 tint; uniform float phase; varying float vWave;
          void main(){float amplitude=.06+.16*pow(abs(vWave),3.0); gl_FragColor=vec4(tint,amplitude*(1.0-smoothstep(.6,1.0,phase)));}`
      });
      const mesh = new T.Mesh(geometry, material); mesh.scale.set(1, .38 + i * .04, 1.2); mesh.position.x = (i - 1) * 1.5; mesh.rotation.y = i * .6; this.fieldGroup.add(mesh);
    }
    this.fieldGroup.visible = false;
  }
  private bindForm(mesh: T.Mesh, uniform: { value: number }) {
    const inject = (material: T.Material) => {
      material.onBeforeCompile = shader => {
        shader.uniforms.uFieldPhase = uniform; shader.uniforms.uFieldTime = this.time;
        const functions = `
          uniform float uFieldPhase; uniform float uFieldTime;
          float fieldAmplitude(vec3 p){
            vec3 q=p-vec3(0.0,2.8,-26.0);
            return (sin(length(q-vec3(-2.0,0.0,1.0))*2.1-uFieldTime*.8)
              +sin(length(q-vec3(2.0,1.0,-1.0))*2.7+uFieldTime*.6)
              +sin((q.x+q.z)*1.4+uFieldTime*.45))/3.0;
          }
        `;
        shader.vertexShader = functions + 'varying vec3 vFieldPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vFieldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;
          float envelope=smoothstep(.08,.35,uFieldPhase)*(1.0-smoothstep(.55,.88,uFieldPhase));
          transformed+=normal*fieldAmplitude(vFieldPosition)*.065*envelope;`);
        shader.fragmentShader = functions + 'varying vec3 vFieldPosition;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec3 cell=floor(vFieldPosition*6.0);
          float grain=fract(sin(dot(cell,vec3(12.9898,78.233,37.719)))*43758.5453);
          float field=fieldAmplitude(vFieldPosition);
          float form=grain*.55+clamp(vFieldPosition.y/6.7,0.0,1.0)*.45-field*(1.0-uFieldPhase)*.22;
          if(uFieldPhase<=.001 || form>uFieldPhase) discard;`);
      };
      material.customProgramCacheKey = () => `field-superposition-${material.type}-${uniform === this.frames ? 'frame' : 'wall'}`;
    };
    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const cloned = source.map(material => { const clone = material.clone(); inject(clone); return clone; });
    mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
    const depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }); inject(depth); mesh.customDepthMaterial = depth;
  }
  update(dt: number, time: number, camera: T.Camera, settings: Settings, sound: (position: T.Vector3) => void) {
    const distance = this.bounds.clampPoint(camera.position, this.nearest).distanceTo(camera.position);
    this.active = activationState(distance, this.active, 12, 4);
    const staticMode = !settings.effects || settings.reducedMotion;
    this.phase = staticMode ? 1 : progressStep(this.phase, Number(this.active), dt, 7.5);
    this.time.value = time; this.fieldPhase.value = this.phase; this.walls.value = T.MathUtils.smoothstep(this.phase, .08, .73);
    this.frames.value = T.MathUtils.smoothstep(this.phase, .42, .81);
    if (!this.critical && this.phase >= this.criticalThreshold) this.critical = true;
    if (this.critical && this.phase <= .66) this.critical = false;
    this.reveal = staticMode ? 1 : progressStep(this.reveal, Number(this.critical), dt, 1.2);
    this.pictures.value = this.reveal;
    this.exhibits.forEach(exhibit => { exhibit.image.visible = this.reveal > .001; });
    this.fieldGroup.visible = !staticMode && distance < 22 && this.phase < .98;
    if (this.critical !== this.lastCritical && this.active && !staticMode) sound(new T.Vector3(0, 2.8, -26));
    this.lastCritical = this.critical;
  }
}
