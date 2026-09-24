import { publicAssetUrl } from '../src/asset-url.js';

// --- PENAMPIL MODEL 3D INTERAKTIF REALVIEW (CAD STUDIO SHADER) ---

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('model3d');
  const shell = document.getElementById('model3d-shell');
  const canvas = document.getElementById('model3d-canvas');
  const fallback = document.getElementById('model3d-fallback');
  const status = document.getElementById('model3d-status');
  const resetButton = document.getElementById('model3d-reset');
  const autoRotateButton = document.getElementById('model3d-autorotate');
  const presetButtons = [...document.querySelectorAll('[data-model-view]')];

  if (!section || !shell || !canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    depth: true,
    powerPreference: 'high-performance'
  });

  const showFallback = (message) => {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
    if (status) {
      status.textContent = message;
      status.classList.remove('ready');
      status.classList.add('error');
    }
  };

  if (!gl) {
    showFallback('Mode gambar statis (WebGL tidak didukung)');
    return;
  }

  // --- SHADER 1: REALVIEW STUDIO PBR SHADER FOR SURFACES ---
  const mainVertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_normal;

    uniform mat4 u_model_view;
    uniform mat4 u_projection;

    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
      v_normal = normalize(mat3(u_model_view) * a_normal);
      v_position = (u_model_view * vec4(a_position, 1.0)).xyz;
      gl_Position = u_projection * u_model_view * vec4(a_position, 1.0);
    }
  `;

  const mainFragmentShaderSource = `
    precision mediump float;

    varying vec3 v_normal;
    varying vec3 v_position;

    uniform vec3 u_base_color;
    uniform float u_specular_strength;
    uniform float u_shininess;

    void main() {
      vec3 N = normalize(v_normal);
      vec3 V = normalize(-v_position);

      // Three-point Studio Lighting
      vec3 keyLightDir = normalize(vec3(-0.45, 0.75, 0.65));
      vec3 fillLightDir = normalize(vec3(0.55, -0.25, 0.45));
      vec3 backLightDir = normalize(vec3(0.0, -0.6, -0.8));

      // Halfway vectors for specular highlights
      vec3 H1 = normalize(keyLightDir + V);
      vec3 H2 = normalize(fillLightDir + V);

      // Diffuse
      float diff1 = max(dot(N, keyLightDir), 0.0);
      float diff2 = max(dot(N, fillLightDir), 0.0) * 0.35;
      float ambient = 0.28;

      // Specular highlights (Blinn-Phong)
      float spec1 = pow(max(dot(N, H1), 0.0), u_shininess) * u_specular_strength;
      float spec2 = pow(max(dot(N, H2), 0.0), u_shininess * 0.5) * (u_specular_strength * 0.3);

      // Fresnel rim glow
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8) * 0.4;

      // Color composition
      vec3 diffuse = u_base_color * (ambient + diff1 * 0.7 + diff2);
      vec3 specular = vec3(0.96, 0.98, 1.0) * (spec1 + spec2);
      vec3 rim = vec3(0.85, 0.92, 1.0) * fresnel;

      vec3 finalColor = diffuse + specular + rim;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // --- SHADER 2: CRISP FEATURE EDGE OUTLINES ---
  const edgeVertexShaderSource = `
    attribute vec3 a_position;
    uniform mat4 u_model_view;
    uniform mat4 u_projection;

    void main() {
      gl_Position = u_projection * u_model_view * vec4(a_position, 1.0);
    }
  `;

  const edgeFragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_edge_color;

    void main() {
      gl_FragColor = u_edge_color;
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || 'Shader gagal dibuat.');
    }
    return shader;
  };

  const createProgram = (vertSource, fragSource) => {
    const prog = gl.createProgram();
    const vs = compileShader(gl.VERTEX_SHADER, vertSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'Program shader gagal ditautkan.');
    }
    return prog;
  };

  let mainProgram;
  let edgeProgram;

  try {
    mainProgram = createProgram(mainVertexShaderSource, mainFragmentShaderSource);
    edgeProgram = createProgram(edgeVertexShaderSource, edgeFragmentShaderSource);
  } catch (error) {
    console.error('Shader 3D tidak dapat disiapkan', error);
    showFallback('Mode gambar statis');
    return;
  }

  // Uniform and Attrib locations for mainProgram
  const mainPosLoc = gl.getAttribLocation(mainProgram, 'a_position');
  const mainNormLoc = gl.getAttribLocation(mainProgram, 'a_normal');
  const mainModelViewLoc = gl.getUniformLocation(mainProgram, 'u_model_view');
  const mainProjLoc = gl.getUniformLocation(mainProgram, 'u_projection');
  const mainBaseColorLoc = gl.getUniformLocation(mainProgram, 'u_base_color');
  const mainSpecStrengthLoc = gl.getUniformLocation(mainProgram, 'u_specular_strength');
  const mainShininessLoc = gl.getUniformLocation(mainProgram, 'u_shininess');

  // Uniform and Attrib locations for edgeProgram
  const edgePosLoc = gl.getAttribLocation(edgeProgram, 'a_position');
  const edgeModelViewLoc = gl.getUniformLocation(edgeProgram, 'u_model_view');
  const edgeProjLoc = gl.getUniformLocation(edgeProgram, 'u_projection');
  const edgeColorLoc = gl.getUniformLocation(edgeProgram, 'u_edge_color');

  // Buffers
  const vertexBuffer = gl.createBuffer();
  const edgeBuffer = gl.createBuffer();

  // Matrices helpers
  const identity = () => new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);

  const multiply = (left, right) => {
    const output = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        output[column * 4 + row] =
          left[row] * right[column * 4] +
          left[4 + row] * right[column * 4 + 1] +
          left[8 + row] * right[column * 4 + 2] +
          left[12 + row] * right[column * 4 + 3];
      }
    }
    return output;
  };

  const translation = (x, y, z) => {
    const matrix = identity();
    matrix[12] = x;
    matrix[13] = y;
    matrix[14] = z;
    return matrix;
  };

  const rotationX = (angle) => {
    const matrix = identity();
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    matrix[5] = cosine;
    matrix[6] = sine;
    matrix[9] = -sine;
    matrix[10] = cosine;
    return matrix;
  };

  const rotationY = (angle) => {
    const matrix = identity();
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    matrix[0] = cosine;
    matrix[2] = -sine;
    matrix[8] = sine;
    matrix[10] = cosine;
    return matrix;
  };

  const perspective = (fieldOfView, aspect, near, far) => {
    const matrix = new Float32Array(16);
    const focal = 1 / Math.tan(fieldOfView / 2);
    matrix[0] = focal / aspect;
    matrix[5] = focal;
    matrix[10] = (far + near) / (near - far);
    matrix[11] = -1;
    matrix[14] = (2 * far * near) / (near - far);
    return matrix;
  };

  // --- STATE ---
  let vertexCount = 0;
  let edgeVertexCount = 0;
  let modelRadius = 58;
  let yaw = -0.62;
  let pitch = -0.34;
  let cameraDistance = 235;
  let dragging = false;
  let previousPointer = null;
  let autoRotate = false;
  let animationFrame = null;
  let previousAnimationTime = null;

  // Visual Styles
  let renderMode = 'shaded-edges'; // 'shaded-edges', 'shaded', 'wireframe'
  let currentMaterial = 'steel';   // 'steel', 'aluminum', 'cyan', 'castiron'

  const MATERIALS = {
    steel: {
      baseColor: [0.76, 0.82, 0.88],
      specularStrength: 0.85,
      shininess: 48.0
    },
    aluminum: {
      baseColor: [0.88, 0.91, 0.95],
      specularStrength: 0.95,
      shininess: 64.0
    },
    cyan: {
      baseColor: [0.12, 0.48, 0.76],
      specularStrength: 0.65,
      shininess: 32.0
    },
    castiron: {
      baseColor: [0.38, 0.41, 0.46],
      specularStrength: 0.42,
      shininess: 18.0
    }
  };

  const viewPresets = {
    isometric: { yaw: -0.62, pitch: -0.34 },
    front: { yaw: 0, pitch: 0 },
    top: { yaw: 0, pitch: Math.PI / 2 - 0.015 },
    right: { yaw: -Math.PI / 2, pitch: 0 }
  };

  const updateActivePreset = (name = '') => {
    presetButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.modelView === name);
    });
  };

  const setPreset = (name) => {
    const preset = viewPresets[name];
    if (!preset) return;
    yaw = preset.yaw;
    pitch = preset.pitch;
    cameraDistance = modelRadius * 3.7;
    updateActivePreset(name);
    render();
    if (typeof window.completeModule === 'function') {
      window.completeModule('model3d');
    }
  };

  // --- ADVANCED STL PARSER WITH SMOOTH NORMALS & FEATURE EDGE EXTRACTION ---
  const parseBinaryStl = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 84) throw new Error('Berkas STL terlalu kecil.');
    const triangleCount = view.getUint32(80, true);
    const requiredBytes = 84 + triangleCount * 50;
    if (triangleCount === 0 || requiredBytes > view.byteLength) {
      throw new Error('Struktur STL tidak valid.');
    }

    const rawVertices = [];
    const faceNormals = [];
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];

    for (let t = 0; t < triangleCount; t += 1) {
      const faceOffset = 84 + (t * 50);
      let fnx = view.getFloat32(faceOffset, true);
      let fny = view.getFloat32(faceOffset + 4, true);
      let fnz = view.getFloat32(faceOffset + 8, true);

      const triCorners = [];
      for (let c = 0; c < 3; c += 1) {
        const vOffset = faceOffset + 12 + (c * 12);
        const x = view.getFloat32(vOffset, true);
        const y = view.getFloat32(vOffset + 4, true);
        const z = view.getFloat32(vOffset + 8, true);
        triCorners.push([x, y, z]);

        minimum[0] = Math.min(minimum[0], x);
        maximum[0] = Math.max(maximum[0], x);
        minimum[1] = Math.min(minimum[1], y);
        maximum[1] = Math.max(maximum[1], y);
        minimum[2] = Math.min(minimum[2], z);
        maximum[2] = Math.max(maximum[2], z);
      }

      // Recompute face normal if zero in STL
      let len = Math.hypot(fnx, fny, fnz);
      if (len < 0.001) {
        const ax = triCorners[1][0] - triCorners[0][0];
        const ay = triCorners[1][1] - triCorners[0][1];
        const az = triCorners[1][2] - triCorners[0][2];
        const bx = triCorners[2][0] - triCorners[0][0];
        const by = triCorners[2][1] - triCorners[0][1];
        const bz = triCorners[2][2] - triCorners[0][2];
        fnx = ay * bz - az * by;
        fny = az * bx - ax * bz;
        fnz = ax * by - ay * bx;
        len = Math.hypot(fnx, fny, fnz) || 1.0;
      }
      fnx /= len;
      fny /= len;
      fnz /= len;

      faceNormals.push([fnx, fny, fnz]);
      rawVertices.push(triCorners);
    }

    // Model Centering & Normalization
    const center = minimum.map((val, idx) => (val + maximum[idx]) / 2);
    modelRadius = 0;

    for (let t = 0; t < triangleCount; t += 1) {
      for (let c = 0; c < 3; c += 1) {
        rawVertices[t][c][0] -= center[0];
        rawVertices[t][c][1] -= center[1];
        rawVertices[t][c][2] -= center[2];
        modelRadius = Math.max(
          modelRadius,
          Math.hypot(rawVertices[t][c][0], rawVertices[t][c][1], rawVertices[t][c][2])
        );
      }
    }
    modelRadius = Math.max(modelRadius, 0.01);

    // 1. Compute Spatial Vertex Map for Smooth Normals
    const quantize = (coord) => `${Math.round(coord[0] * 200)},${Math.round(coord[1] * 200)},${Math.round(coord[2] * 200)}`;
    const vertexFacesMap = new Map();

    for (let t = 0; t < triangleCount; t += 1) {
      for (let c = 0; c < 3; c += 1) {
        const key = quantize(rawVertices[t][c]);
        if (!vertexFacesMap.has(key)) {
          vertexFacesMap.set(key, []);
        }
        vertexFacesMap.get(key).push(t);
      }
    }

    // 2. Feature Edge Extraction (Sharp crease edges & boundaries)
    const edgeMap = new Map();
    const makeEdgeKey = (p1, p2) => {
      const k1 = quantize(p1);
      const k2 = quantize(p2);
      return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    };

    for (let t = 0; t < triangleCount; t += 1) {
      const tri = rawVertices[t];
      for (let i = 0; i < 3; i += 1) {
        const p1 = tri[i];
        const p2 = tri[(i + 1) % 3];
        const eKey = makeEdgeKey(p1, p2);
        if (!edgeMap.has(eKey)) {
          edgeMap.set(eKey, { p1, p2, normals: [faceNormals[t]] });
        } else {
          edgeMap.get(eKey).normals.push(faceNormals[t]);
        }
      }
    }

    const edgeLineVertices = [];
    edgeMap.forEach((edge) => {
      if (edge.normals.length === 1) {
        // Boundary edge
        edgeLineVertices.push(...edge.p1, ...edge.p2);
      } else if (edge.normals.length === 2) {
        // Crease angle between adjacent faces
        const dotProduct =
          edge.normals[0][0] * edge.normals[1][0] +
          edge.normals[0][1] * edge.normals[1][1] +
          edge.normals[0][2] * edge.normals[1][2];
        // If angle > 28 degrees (dot product < 0.88), mark as sharp CAD edge
        if (dotProduct < 0.88) {
          edgeLineVertices.push(...edge.p1, ...edge.p2);
        }
      }
    });

    // 3. Assemble Interleaved Triangle Data (Position + Smooth Normals)
    const interleaved = new Float32Array(triangleCount * 18);

    for (let t = 0; t < triangleCount; t += 1) {
      const fNorm = faceNormals[t];
      for (let c = 0; c < 3; c += 1) {
        const vert = rawVertices[t][c];
        const key = quantize(vert);
        const adjacentFaces = vertexFacesMap.get(key) || [t];

        // Average normals of faces that share this crease (< 45 deg)
        let nx = 0;
        let ny = 0;
        let nz = 0;
        for (let af of adjacentFaces) {
          const an = faceNormals[af];
          const dotP = fNorm[0] * an[0] + fNorm[1] * an[1] + fNorm[2] * an[2];
          if (dotP > 0.707) { // 45 degrees
            nx += an[0];
            ny += an[1];
            nz += an[2];
          }
        }
        const nLen = Math.hypot(nx, ny, nz) || 1.0;
        nx /= nLen;
        ny /= nLen;
        nz /= nLen;

        const outIdx = (t * 3 + c) * 6;
        interleaved[outIdx] = vert[0];
        interleaved[outIdx + 1] = vert[1];
        interleaved[outIdx + 2] = vert[2];
        interleaved[outIdx + 3] = nx;
        interleaved[outIdx + 4] = ny;
        interleaved[outIdx + 5] = nz;
      }
    }

    // Upload Triangle Buffers
    vertexCount = triangleCount * 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);

    // Upload Edge Buffers
    edgeVertexCount = edgeLineVertices.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edgeLineVertices), gl.STATIC_DRAW);

    cameraDistance = modelRadius * 3.7;
  };

  // --- RENDER FUNCTION ---
  const resizeCanvas = () => {
    const width = Math.max(1, shell.clientWidth);
    const height = Math.max(1, shell.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.round(width * pixelRatio);
    const displayHeight = Math.round(height * pixelRatio);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const render = () => {
    if (!vertexCount || !section.classList.contains('active')) return;
    resizeCanvas();

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Matrices
    const baseOrientation = rotationX(-Math.PI / 2);
    const orbit = multiply(rotationY(yaw), rotationX(pitch));
    const model = multiply(orbit, baseOrientation);
    const view = translation(0, -modelRadius * 0.06, -cameraDistance);
    const modelView = multiply(view, model);
    const projection = perspective(
      Math.PI / 4,
      Math.max(0.1, canvas.width / canvas.height),
      Math.max(0.1, cameraDistance - modelRadius * 2.2),
      cameraDistance + modelRadius * 3
    );

    const mat = MATERIALS[currentMaterial] || MATERIALS.steel;

    // 1. Render Surfaces (Shaded)
    if (renderMode === 'shaded-edges' || renderMode === 'shaded') {
      gl.useProgram(mainProgram);
      gl.uniformMatrix4fv(mainModelViewLoc, false, modelView);
      gl.uniformMatrix4fv(mainProjLoc, false, projection);
      gl.uniform3fv(mainBaseColorLoc, mat.baseColor);
      gl.uniform1f(mainSpecStrengthLoc, mat.specularStrength);
      gl.uniform1f(mainShininessLoc, mat.shininess);

      // Offset polygons backwards so edge lines render cleanly on top
      if (renderMode === 'shaded-edges') {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1.2, 1.2);
      } else {
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(mainPosLoc);
      gl.vertexAttribPointer(mainPosLoc, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(mainNormLoc);
      gl.vertexAttribPointer(mainNormLoc, 3, gl.FLOAT, false, 24, 12);

      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    }

    // 2. Render CAD Feature Edges (Outlines)
    if ((renderMode === 'shaded-edges' || renderMode === 'wireframe') && edgeVertexCount > 0) {
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.useProgram(edgeProgram);
      gl.uniformMatrix4fv(edgeModelViewLoc, false, modelView);
      gl.uniformMatrix4fv(edgeProjLoc, false, projection);

      const edgeColor = renderMode === 'wireframe' ? [0.15, 0.45, 0.78, 1.0] : [0.10, 0.16, 0.24, 0.88];
      gl.uniform4fv(edgeColorLoc, edgeColor);

      gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuffer);
      gl.enableVertexAttribArray(edgePosLoc);
      gl.vertexAttribPointer(edgePosLoc, 3, gl.FLOAT, false, 12, 0);

      gl.drawArrays(gl.LINES, 0, edgeVertexCount);
    }
  };

  // --- ANIMATION LOOP ---
  const stopAnimationLoop = () => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousAnimationTime = null;
  };

  const animate = (timestamp) => {
    animationFrame = null;
    if (!autoRotate || !section.classList.contains('active')) {
      previousAnimationTime = null;
      return;
    }
    if (previousAnimationTime !== null) {
      const elapsed = Math.min(40, timestamp - previousAnimationTime);
      yaw += elapsed * 0.00035;
    }
    previousAnimationTime = timestamp;
    render();
    animationFrame = requestAnimationFrame(animate);
  };

  const startAnimationLoop = () => {
    if (animationFrame === null && autoRotate && section.classList.contains('active')) {
      animationFrame = requestAnimationFrame(animate);
    }
  };

  // --- MODEL LIBRARY DICTIONARY ---
  const CAD_MODELS = {
    'bracket-93': {
      title: 'Bracket 93',
      eyebrow: 'Rekonstruksi 2D ke 3D · Modeling Practice 93',
      stlUrl: publicAssetUrl('/models/bracket-93/bracket-93-reference.stl'),
      glbUrl: publicAssetUrl('/models/bracket-93/bracket-93-reference.glb'),
      sldprtUrl: null,
      macroUrl: publicAssetUrl('/models/bracket-93/bracket-93.FCMacro'),
      sourceImage: publicAssetUrl('/models/bracket-93/bracket-93-source.jpg'),
      previewImage: publicAssetUrl('/models/bracket-93/bracket-93-preview.png'),
      specs: [
        { label: 'Ukuran alas', val: '72 × 35 mm' },
        { label: 'Lubang', val: '3 × Ø12 mm' },
        { label: 'Boss atas', val: 'Ø30 × 13 mm' },
        { label: 'Radius utama', val: 'R15' },
        { label: 'Penguat', val: 'Rib 10 mm · 60°' }
      ],
      note: 'Ketebalan alas menggunakan 10 mm dari tampak depan. Pada potongan samping juga terlihat angka 6 mm sehingga ukuran ini perlu dikonfirmasi sebelum produksi.'
    },
    'part-2': {
      title: 'Part 2 (Stepped T-Block)',
      eyebrow: 'Balok Bertingkat ISO · Latihan Proyeksi Kuadran',
      stlUrl: publicAssetUrl('/models/solidworks-library/part-2.stl'),
      glbUrl: null,
      sldprtUrl: publicAssetUrl('/models/solidworks-library/part-2.SLDPRT'),
      macroUrl: null,
      sourceImage: publicAssetUrl('/models/solidworks-library/part-2-preview.png'),
      previewImage: publicAssetUrl('/models/solidworks-library/part-2-preview.png'),
      specs: [
        { label: 'Dimensi luar', val: '60 × 30 × 50 mm' },
        { label: 'Tingkat sayap', val: 'Tinggi 25 mm (kiri & kanan)' },
        { label: 'Tingkat tengah', val: 'Tinggi 50 mm' },
        { label: 'Lebar langkah', val: '20 mm / tingkat' },
        { label: 'Aplikasi', val: 'Latihan Proyeksi Orthogonal Kuadran' }
      ],
      note: 'Model balok bertingkat 3 step untuk melatih interpretasi visual tampak depan, tampak atas, dan tampak samping berundak.'
    },
    'job-flange-connector': {
      title: 'Job Flange Connector',
      eyebrow: 'Dudukan Flens Poros & Alur Pasak Ganda',
      stlUrl: publicAssetUrl('/models/solidworks-library/job-flange-connector.stl'),
      glbUrl: null,
      sldprtUrl: publicAssetUrl('/models/solidworks-library/job-flange-connector.SLDPRT'),
      macroUrl: null,
      sourceImage: publicAssetUrl('/models/solidworks-library/job-flange-connector-preview.png'),
      previewImage: publicAssetUrl('/models/solidworks-library/job-flange-connector-preview.png'),
      specs: [
        { label: 'Dimensi dasar', val: '140 × 50 × 10 mm' },
        { label: 'Silinder luar', val: 'Ø64 × tinggi 50 mm' },
        { label: 'Lubang buntu', val: 'Ø40 × kedalaman 24 mm' },
        { label: 'Alur garpu', val: '2 alur lebar 20 mm' },
        { label: 'Panjang alur', val: '30 mm pada tiap ujung' }
      ],
      note: 'Dudukan flens silindris dengan lubang buntu Ø40 mm dan sepasang alur pengunci pasak 20 mm untuk dudukan bearing mesin.'
    },
    'job-kelas-extrim': {
      title: 'Job Kelas Extrim',
      eyebrow: 'Model Asli SolidWorks 2023 · Pelat Braket & Rusuk Penguat',
      stlUrl: publicAssetUrl('/models/solidworks-library/job-kelas-extrim.stl'),
      glbUrl: null,
      sldprtUrl: publicAssetUrl('/models/solidworks-library/job-kelas-extrim.SLDPRT'),
      macroUrl: null,
      sourceImage: publicAssetUrl('/models/solidworks-library/job-kelas-extrim-preview.png'),
      previewImage: publicAssetUrl('/models/solidworks-library/job-kelas-extrim-preview.png'),
      specs: [
        { label: 'Dimensi luar (X×Y×Z)', val: '230 × 225 × 80 mm' },
        { label: 'Resolusi mesh', val: '1.940 Segitiga (Binary STL)' },
        { label: 'Sumber model', val: 'SolidWorks 2023 Part Asli' },
        { label: 'Fitur utama', val: 'Pelat dudukan, boss bore, rusuk penguat' },
        { label: 'Akurasi geometri', val: '100% CAD Asli (Presisi 1:1)' }
      ],
      note: 'Model 3D asli yang diekspor langsung dari SolidWorks. Seluruh dimensi, kelengkungan, dan geometri telah 100% presisi sesuai rancangan SolidWorks aslinya.'
    }
  };

  let currentModelKey = 'bracket-93';

  const loadCadModel = (modelKey, shouldScroll = false) => {
    const config = CAD_MODELS[modelKey];
    if (!config) return;

    currentModelKey = modelKey;
    if (status) {
      status.textContent = `Memuat ${config.title}...`;
      status.classList.remove('ready', 'error');
    }

    // Update Tab UI
    document.querySelectorAll('.cad-model-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.cadModel === modelKey);
    });

    // Update Viewer Heading
    const titleEl = document.getElementById('model3d-title');
    const eyebrowEl = document.getElementById('model3d-eyebrow');
    if (titleEl) titleEl.textContent = config.title;
    if (eyebrowEl) eyebrowEl.textContent = config.eyebrow;

    // Update fallback image
    if (fallback) {
      fallback.src = config.previewImage;
      fallback.alt = `Pratinjau model 3D ${config.title}`;
    }

    // Update Reference Panel
    const refTitle = document.getElementById('model-ref-title');
    const refLink = document.getElementById('model-ref-link');
    const refImg = document.getElementById('model-ref-img');
    const refSpecs = document.getElementById('model-ref-specs');
    const refNote = document.getElementById('model-ref-note');
    const refDownloads = document.getElementById('model-ref-downloads');

    if (refTitle) refTitle.textContent = config.title;
    if (refLink) refLink.href = config.sourceImage || config.previewImage;
    if (refImg) refImg.src = config.sourceImage || config.previewImage;
    if (refNote) refNote.textContent = config.note;

    if (refSpecs) {
      refSpecs.innerHTML = config.specs.map(s => `
        <div><dt>${s.label}</dt><dd>${s.val}</dd></div>
      `).join('');
    }

    if (refDownloads) {
      let dlHtml = '';
      if (config.stlUrl) {
        dlHtml += `<a class="glass-btn" href="${config.stlUrl}" download>Unduh STL</a>`;
      }
      if (config.glbUrl) {
        dlHtml += `<a class="cta-button" href="${config.glbUrl}" download>Unduh GLB</a>`;
      }
      if (config.sldprtUrl) {
        dlHtml += `<a class="cta-button" href="${config.sldprtUrl}" download style="background: linear-gradient(135deg, #107c41 0%, #1f9a55 100%);">Unduh SLDPRT</a>`;
      }
      if (config.macroUrl) {
        dlHtml += `<a class="model-macro-link" href="${config.macroUrl}" download>Macro FreeCAD</a>`;
      }
      refDownloads.innerHTML = dlHtml;
    }

    // Fetch and parse STL
    fetch(config.stlUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Model tidak ditemukan (${response.status}).`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        parseBinaryStl(arrayBuffer);
        if (canvas) canvas.hidden = false;
        if (fallback) fallback.hidden = true;
        if (status) {
          status.textContent = 'Model siap diputar';
          status.classList.remove('error');
          status.classList.add('ready');
        }
        setPreset('isometric');
        if (section.classList.contains('active')) requestAnimationFrame(render);
        if (typeof window.completeModule === 'function') {
          window.completeModule('model3d');
        }
      })
      .catch(error => {
        console.error(`Model ${config.title} gagal dimuat:`, error);
        showFallback('Mode gambar statis');
      });

    if (shouldScroll && shell) {
      shell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  window.loadCadModel = loadCadModel;

  // --- USER STL FILE LOADER (DRAG & DROP / UPLOAD) ---
  const loadCustomStlArrayBuffer = (buffer, filename = 'Model CAD Eksternal') => {
    try {
      parseBinaryStl(buffer);
      if (canvas) canvas.hidden = false;
      if (fallback) fallback.hidden = true;
      if (status) {
        status.textContent = `File siap: ${filename}`;
        status.classList.remove('error');
        status.classList.add('ready');
      }

      // Update titles
      const titleEl = document.getElementById('model3d-title');
      const eyebrowEl = document.getElementById('model3d-eyebrow');
      if (titleEl) titleEl.textContent = filename.replace(/\.[^/.]+$/, '');
      if (eyebrowEl) eyebrowEl.textContent = 'Model STL Impor Kustom';

      document.querySelectorAll('.cad-model-tab').forEach(t => t.classList.remove('active'));
      setPreset('isometric');
      if (section.classList.contains('active')) requestAnimationFrame(render);
      if (typeof window.completeModule === 'function') {
        window.completeModule('model3d', `Impor CAD: ${filename}`);
      }
    } catch (err) {
      console.error('Gagal memuat STL kustom:', err);
      alert('Gagal membaca file STL. Pastikan file berformat STL biner.');
    }
  };

  const uploadInput = document.getElementById('cad-user-file-input');
  const btnUpload = document.getElementById('btn-upload-stl');

  btnUpload?.addEventListener('click', () => {
    uploadInput?.click();
  });

  uploadInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          loadCustomStlArrayBuffer(evt.target.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // Drag & drop support on 3D viewport
  shell.addEventListener('dragover', (e) => {
    e.preventDefault();
    shell.classList.add('drag-over');
  });

  shell.addEventListener('dragleave', () => {
    shell.classList.remove('drag-over');
  });

  shell.addEventListener('drop', (e) => {
    e.preventDefault();
    shell.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.stl')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          loadCustomStlArrayBuffer(evt.target.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // --- RENDER MODE & MATERIAL SWITCHERS ---
  document.querySelectorAll('[data-render-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-render-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMode = btn.dataset.renderMode || 'shaded-edges';
      render();
    });
  });

  document.querySelectorAll('[data-mat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-mat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMaterial = btn.dataset.mat || 'steel';
      render();
    });
  });

  // CAD Model Tabs listeners
  document.querySelectorAll('.cad-model-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const modelKey = tab.dataset.cadModel;
      if (modelKey) loadCadModel(modelKey);
    });
  });

  // SolidWorks cards "Putar Model 3D" listeners
  document.querySelectorAll('[data-view-cad]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modelKey = btn.dataset.viewCad;
      if (modelKey) loadCadModel(modelKey, true);
    });
  });

  // Preset Buttons
  presetButtons.forEach(button => {
    button.addEventListener('click', () => setPreset(button.dataset.modelView));
  });

  // Reset Button
  resetButton?.addEventListener('click', () => {
    autoRotate = false;
    autoRotateButton?.setAttribute('aria-pressed', 'false');
    stopAnimationLoop();
    setPreset('isometric');
    canvas.focus({ preventScroll: true });
  });

  // Auto-rotate Toggle
  autoRotateButton?.addEventListener('click', () => {
    autoRotate = !autoRotate;
    autoRotateButton.setAttribute('aria-pressed', String(autoRotate));
    if (autoRotate) {
      updateActivePreset();
      startAnimationLoop();
    } else {
      stopAnimationLoop();
      render();
    }
  });

  // Pointer drag rotate
  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    updateActivePreset();
  });

  canvas.addEventListener('pointermove', event => {
    if (!dragging || !previousPointer) return;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    yaw += deltaX * 0.009;
    pitch = Math.max(-1.48, Math.min(1.48, pitch + deltaY * 0.008));
    previousPointer = { x: event.clientX, y: event.clientY };
    render();
  });

  const stopDragging = event => {
    if (!dragging) return;
    dragging = false;
    previousPointer = null;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {}
  };

  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);

  // Wheel zoom
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    cameraDistance = Math.max(modelRadius * 1.8, Math.min(modelRadius * 6.5, cameraDistance + event.deltaY * 0.13));
    render();
  }, { passive: false });

  // Keyboard navigation
  canvas.addEventListener('keydown', event => {
    const rotationStep = event.shiftKey ? 0.18 : 0.09;
    if (event.key === 'ArrowLeft') yaw -= rotationStep;
    else if (event.key === 'ArrowRight') yaw += rotationStep;
    else if (event.key === 'ArrowUp') pitch = Math.max(-1.48, pitch - rotationStep);
    else if (event.key === 'ArrowDown') pitch = Math.min(1.48, pitch + rotationStep);
    else if (event.key === '+' || event.key === '=') cameraDistance = Math.max(modelRadius * 1.8, cameraDistance - modelRadius * 0.18);
    else if (event.key === '-') cameraDistance = Math.min(modelRadius * 6.5, cameraDistance + modelRadius * 0.18);
    else if (event.key === '0') setPreset('isometric');
    else return;

    event.preventDefault();
    updateActivePreset();
    render();
  });

  const sectionObserver = new MutationObserver(() => {
    if (section.classList.contains('active')) {
      requestAnimationFrame(() => {
        render();
        startAnimationLoop();
      });
    } else {
      stopAnimationLoop();
    }
  });
  sectionObserver.observe(section, { attributes: true, attributeFilter: ['class'] });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(render));
    resizeObserver.observe(shell);
  } else {
    window.addEventListener('resize', render);
  }

  // Load initial model
  loadCadModel('bracket-93');
});
