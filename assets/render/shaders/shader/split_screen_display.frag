#version 460 core
#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable

// Split screen display - GT on left, Optimized on right

layout(set = 0, binding = 0) uniform texture2D uGTRenderTarget;
layout(set = 0, binding = 1) uniform texture2D uOptRenderTarget;
layout(set = 0, binding = 2) uniform sampler uSampler;

layout(push_constant, std430) uniform uPushConstant {
    vec4 splitPosition;  // x: split position (0.5 = middle), yzw: unused
};

layout(location = 0) in vec2 inUv;

layout(location = 0) out vec4 outColor;

void main() {
    const vec2 uv = inUv;
    
    vec4 color;
    if (uv.x < splitPosition.x) {
        // Left side: Ground Truth
        color = textureLod(sampler2D(uGTRenderTarget, uSampler), uv, 0);
    } else {
        // Right side: Optimized result
        // Adjust UV to map to right half
        vec2 rightUv = vec2((uv.x - splitPosition.x) / (1.0 - splitPosition.x), uv.y);
        color = textureLod(sampler2D(uOptRenderTarget, uSampler), rightUv, 0);
    }
    
    outColor = color;
}