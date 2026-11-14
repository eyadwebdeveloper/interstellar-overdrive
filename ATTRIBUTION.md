# Anatomy model attribution

The three 3D model sets in `public/models/` come from the Human-Atlas project
and are shown in the AURA body view. All three datasets are redistributed and
adapted under Creative Commons Attribution 4.0 International.

## Male body (`atlas.json`, `body-*.bin.gz`)

BodyParts3D, © The Database Center for Life Science, licensed under CC
Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and
  inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database
  for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up;
translated to rest at the stage; geometry simplified with meshoptimizer to a
0.2% relative error limit per structure; normals quantized to signed 16-bit;
packed into binary chunks (`positions | normals | indices` per structure,
4-byte aligned). The source contains 2,234 individual OBJ meshes; all remain
represented and individually selectable. See `atlas.json` for the manifest.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and
anatomical illustration refinements. It is not a complete model of every
possible human anatomical structure or variation. This interface is
educational and is not a clinical tool.

## Female body (`atlas-female.json`, `female-*.bin.gz`)

Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D
Reference Organ Set for Female* (2023-2026). CC BY 4.0. The viewer packages
release v1.10, with eight pelvic structures carried over from v1.5.

- Citation: Browne, Kristen, and Heidi Schlehlein. *3D Reference Organ Set
  for Female, v1.10*. HuBMAP, 2026.
- Reference library: https://humanatlas.io/3d-reference-library
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/assets/3d-vh-f-united.glb
- Supplement GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: node transforms baked, native meter/Y-up coordinates translated
onto the stage, coincident vertices welded and source normals averaged,
geometry simplified to the same 0.2% per-structure bound, normals quantized.
1,220 meshes (964 source meshes plus borrowed and donor structures below).

This is a reference assembly with whole-body surface and selected organs,
including female reproductive anatomy. Its skeleton covers the vertebrae,
sternum and manubrium, pelvis, and knee bones; there is no skull, rib, arm,
hand, or foot bone in the source at any release.

### Borrowed male bones (180 meshes)

The female source models no skull, ribs, shoulder girdle, arm, or foot bones.
180 such bones are copied from the BodyParts3D male reference credited above,
placed by a least-squares fit of a uniform scale and translation onto
structures both bodies model, then rotated about the shoulder or ankle joint
to match the female body's limb posture (17-23 degrees). They are shown in a
display system labelled "Male-derived bones", drawn in a distinct colour, and
switched off by default. They are a labelled placeholder for shape and
position, not female anatomy.

### Leg muscles (76 meshes, also shown on their own as the third model)

Thor E. Andreassen, Donald R. Hume, Landon D. Hamilton, Karen E. Walker,
Sean E. Higinbotham, and Kevin B. Shelburne, *Three Dimensional Lower
Extremity Musculoskeletal Geometry of the Visible Human Female and Male*,
Scientific Data 10, 34 (2023). CC BY 4.0.

- Publication: https://doi.org/10.1038/s41597-022-01905-2
- Dataset: https://simtk.org/projects/3d-vh-geometry
- Package used: `Final 3D STL Models-stl.zip` (Visible Human Female)
- License: https://creativecommons.org/licenses/by/4.0/

76 lower-limb muscles are added to the female reference body, which models
almost no muscle of its own. They are a second woman's anatomy, not this
body's, and are shown in a display system of their own. In AURA they are
also selectable as the "Leg muscles" model, which streams only the two
chunks they occupy (~4 MB).

## Rendering licence note

The AURA viewer (this app) renders these datasets with its own materials,
lighting, and stage; the binary chunk format and manifests are documented in
`src/lib/anatomy/types.ts` and `src/lib/anatomy/loader.ts`. Per-dataset
credit is shown in the interface next to every viewport and under the model
switcher, as required by CC BY 4.0.
