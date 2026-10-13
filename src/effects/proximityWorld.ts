import * as T from 'three';
import type { Settings } from '../types';

// A final spatial gate applies to every surface, including floors, instruments,
// glass, frame mounts and particles. Existing assembly shaders still run first.
export class ProximityWorld {
  readonly range = 10;
  private observer = { value: new T.Vector3() };
  private enabled = { value: 1 };
  constructor(scene: T.Scene) {
    const wrapped = new Map<T.Material, T.Material>();
    const wrap = (source: T.Material) => {
      const existing = wrapped.get(source); if (existing) return existing;
      const material = source.clone(), previous = source.onBeforeCompile;
      const key = source.customProgramCacheKey();
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.uniforms.uWorldObserver = this.observer; shader.uniforms.uWorldGate = this.enabled;
        const project = `
          vec4 proximityPosition=vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            proximityPosition=instanceMatrix*proximityPosition;
          #endif
          vProximityWorld=(modelMatrix*proximityPosition).xyz;
          #include <project_vertex>`;
        shader.vertexShader = 'varying vec3 vProximityWorld;\n' + (shader.vertexShader.includes('#include <project_vertex>')
          ? shader.vertexShader.replace('#include <project_vertex>', project)
          : shader.vertexShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main(){vProximityWorld=(modelMatrix*vec4(position,1.0)).xyz;'));
        const gate = `
          if(uWorldGate>.5){
            float distanceToVisitor=distance(vProximityWorld,uWorldObserver);
            float spatialAssembly=1.0-smoothstep(6.0,10.0,distanceToVisitor);
            vec3 proximityCell=floor(vProximityWorld*9.0);
            float proximityGrain=fract(sin(dot(proximityCell,vec3(12.9898,78.233,37.719)))*43758.5453);
            if(distanceToVisitor>=10.0 || proximityGrain>spatialAssembly) discard;
          }`;
        shader.fragmentShader = 'uniform vec3 uWorldObserver; uniform float uWorldGate; varying vec3 vProximityWorld;\n' + (shader.fragmentShader.includes('#include <clipping_planes_fragment>')
          ? shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + gate)
          : shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main(){' + gate));
      };
      material.customProgramCacheKey = () => `proximity-world-${key}`;
      wrapped.set(source, material); return material;
    };
    scene.traverse(object => {
      if (!(object instanceof T.Mesh || object instanceof T.Line)) return;
      object.material = Array.isArray(object.material) ? object.material.map(wrap) : wrap(object.material);
      if (object instanceof T.Mesh) {
        const depth = object.customDepthMaterial || new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
        object.customDepthMaterial = wrap(depth);
      }
    });
  }
  update(camera: T.Camera, settings: Settings) {
    this.observer.value.copy(camera.position);
    this.enabled.value = !settings.effects || settings.reducedMotion ? 0 : 1;
  }
}
