cmake_minimum_required(VERSION 3.24)
project(AGPRender)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

#
# Download LumeShaderCompiler.exe
#
if(NOT EXISTS "${CMAKE_BINARY_DIR}/LumeShaderCompiler.exe")
  file(DOWNLOAD
    "https://github.com/jsnchng/LumeShaderCompiler/releases/download/v1.0.0-alpha/LumeShaderCompiler.exe"
    "${CMAKE_BINARY_DIR}/LumeShaderCompiler.exe"
    EXPECTED_HASH SHA256=40c5382909b8e8033fd8eaa326963f84448865190f7000c4e8b91e6fd30be587
    SHOW_PROGRESS)
endif()

#
# Target: Vulkan. Install VulkanSDK from https://vulkan.lunarg.com/sdk/home
#
find_package(Vulkan REQUIRED)

# Platform-specific Vulkan settings
if(APPLE)
    set_target_properties(Vulkan::Vulkan PROPERTIES INTERFACE_COMPILE_DEFINITIONS 
        VK_USE_PLATFORM_METAL_EXT=1)
elseif(WIN32)
    set_target_properties(Vulkan::Vulkan PROPERTIES INTERFACE_COMPILE_DEFINITIONS 
        VK_USE_PLATFORM_WIN32_KHR=1)
elseif(UNIX AND NOT APPLE)
    set_target_properties(Vulkan::Vulkan PROPERTIES INTERFACE_COMPILE_DEFINITIONS 
        VK_USE_PLATFORM_XLIB_KHR=1)
endif()

#
# Target: AGPBaseAPI
#
if(NOT TARGET AGPBase::AGPBaseAPI)
  add_subdirectory(LumeBase)
endif()

#
# Target: AGPEngineAPI
#
if(NOT TARGET AGPEngine::AGPEngineAPI)
  add_subdirectory(LumeEngine)
  set(ENGINE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/LumeEngine")
else()
  get_filename_component(ENGINE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../LumeEngine" ABSOLUTE)
endif()

#
# Target: AGPRenderAPI
#
add_library(AGPRenderAPI INTERFACE)
add_library(AGPRender::AGPRenderAPI ALIAS AGPRenderAPI)
target_include_directories(AGPRenderAPI INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/api)
target_link_libraries(AGPRenderAPI INTERFACE Vulkan::Vulkan)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_PERF_ENABLED=0)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_DEBUG_MARKERS_ENABLED=0)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_HAS_EXPERIMENTAL=0)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_HAS_VULKAN_BACKEND=1)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_HAS_GLES_BACKEND=0)
target_compile_definitions(AGPRenderAPI INTERFACE RENDER_HAS_GL_BACKEND=0)

#
# Target:AGPRender
#
file(GLOB_RECURSE AGPRender_sources "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/gles/.*")
list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/device/ohos/.*")
list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/vulkan/ohos/.*")
list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/plugin/.*")

# Platform-specific source filtering
if(APPLE)
    list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/vulkan/windows/.*")
elseif(WIN32)
    list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/vulkan/macos/.*")
elseif(UNIX AND NOT APPLE)
    list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/vulkan/windows/.*")
    list(FILTER AGPRender_sources EXCLUDE REGEX ".*/src/vulkan/macos/.*")
endif()
add_library(AGPRender STATIC
  ${AGPRender_sources}
  ${CMAKE_CURRENT_SOURCE_DIR}/src/plugin/static_plugin.cpp
  ${CMAKE_CURRENT_SOURCE_DIR}/src/plugin/static_registry.cpp
  ${CMAKE_CURRENT_SOURCE_DIR}/version.cpp)
add_library(AGPRender::AGPRender ALIAS AGPRender)
target_include_directories(AGPRender PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/third_party
  ${CMAKE_CURRENT_SOURCE_DIR}/assets
  ${CMAKE_CURRENT_SOURCE_DIR}/src)

# Platform-specific include directories
if(APPLE)
  target_include_directories(AGPRender PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src/vulkan/macos)
elseif(WIN32)
  target_include_directories(AGPRender PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src/vulkan/windows)
elseif(UNIX AND NOT APPLE)
  target_include_directories(AGPRender PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src/vulkan/linux)
endif()
target_link_libraries(AGPRender PRIVATE Vulkan::Vulkan)
target_link_libraries(AGPRender PRIVATE
  AGPBase::AGPBaseAPI
  AGPEngine::AGPEngineAPI
  AGPRenderAPI)
target_compile_definitions(AGPRender PRIVATE RENDER_BUILDTYPE="$<CONFIG>")
target_compile_definitions(AGPRender PUBLIC CORE_STATIC_PLUGIN_HEADER="${ENGINE_DIR}/src/static_plugin_decl.h")
if(WIN32)
    target_compile_definitions(AGPRender PRIVATE "RENDER_PUBLIC=__declspec(dllexport)")
else()
    target_compile_definitions(AGPRender PRIVATE "RENDER_PUBLIC=__attribute__((visibility(\"default\")))")
endif()
target_compile_definitions(AGPRender PUBLIC RENDER_HAS_VULKAN_BACKEND=1)
target_compile_definitions(AGPRender PRIVATE
  VMA_STATS_STRING_ENABLED=0
  VMA_STATIC_VULKAN_FUNCTIONS=0
  USE_NEW_VMA=1)
target_compile_definitions(AGPRender PUBLIC RENDER_HAS_GLES_BACKEND=0)
target_compile_definitions(AGPRender PUBLIC RENDER_HAS_GL_BACKEND=0)
if(WIN32)
    target_compile_definitions(AGPRender PUBLIC NOMINMAX)
endif()
target_compile_definitions(AGPRender PUBLIC RENDER_DEV_ENABLED=0)
target_compile_definitions(AGPRender PRIVATE RENDER_LOG_TO_CONSOLE=1)
target_compile_definitions(AGPRender PRIVATE RENDER_LOG_TO_DEBUG_OUTPUT=1)
target_compile_definitions(AGPRender PRIVATE RENDER_LOG_TO_FILE=0)
target_compile_definitions(AGPRender PUBLIC RENDER_VALIDATION_ENABLED=1)
target_compile_definitions(AGPRender PRIVATE RENDER_EMBEDDED_ASSETS_ENABLED=0)
target_compile_definitions(AGPRender PUBLIC RENDER_VULKAN_VALIDATION_ENABLED=1)
target_compile_definitions(AGPRender PRIVATE RENDER_VULKAN_VALIDATION_ENABLE_WARNINGS=1)
target_compile_definitions(AGPRender PRIVATE RENDER_VULKAN_VALIDATION_ENABLE_INFORMATION=0)
target_compile_definitions(AGPRender PRIVATE RENDER_DEBUG_GPU_RESOURCE_IDS=0)
target_compile_definitions(AGPRender PRIVATE RENDER_DEBUG_COMMAND_MARKERS_ENABLED=0)
target_compile_definitions(AGPRender PUBLIC RENDER_GL_FLIP_Y_SWAPCHAIN=0)
target_compile_definitions(AGPRender PRIVATE RENDER_GL_DEBUG=1)
target_compile_definitions(AGPRender PUBLIC RENDER_GPU_TIMESTAMP_QUERIES_ENABLED=0)
target_compile_definitions(AGPRender PUBLIC RENDER_VULKAN_FSR_ENABLED=0)
target_compile_definitions(AGPRender PUBLIC RENDER_VULKAN_RT_ENABLED=0)
if(WIN32)
    target_compile_options(AGPRender PRIVATE /GR-)
else()
    target_compile_options(AGPRender PRIVATE -fvisibility=hidden)
endif()
set(shader_compiler_executable "${CMAKE_BINARY_DIR}/LumeShaderCompiler.exe")
set(argument_list)
list(APPEND argument_list "--optimize")
list(APPEND argument_list "--source")
list(APPEND argument_list ${CMAKE_CURRENT_SOURCE_DIR}/assets/render/shaders)
list(APPEND argument_list "--include")
list(APPEND argument_list ${CMAKE_CURRENT_SOURCE_DIR}/api)
list(APPEND argument_list "--vulkan")
list(APPEND argument_list "1.1")
list(APPEND argument_list "--check-if-changed")
add_custom_target(RenderCompileShaders ALL
  COMMAND ${shader_compiler_executable} ${argument_list}
  COMMAND_EXPAND_LISTS)
add_dependencies(AGPRender RenderCompileShaders)

#
# Target: PluginAGPRender
#
add_library(PluginAGPRender SHARED
  ${CMAKE_CURRENT_SOURCE_DIR}/src/plugin/dynamic_plugin.cpp
  ${CMAKE_CURRENT_SOURCE_DIR}/src/plugin/dynamic_registry.cpp
  ${CMAKE_CURRENT_SOURCE_DIR}/src/util/json.cpp)
add_library(AGPRender::PluginAGPRender ALIAS PluginAGPRender)
target_include_directories(PluginAGPRender PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_link_libraries(PluginAGPRender PRIVATE
  AGPBase::AGPBaseAPI
  AGPEngine::AGPEngineAPI
  AGPRender::AGPRender
  AGPRender::AGPRenderAPI)
target_compile_definitions(PluginAGPRender PRIVATE CORE_PLUGIN=1)
if(WIN32)
    target_compile_options(PluginAGPRender PRIVATE /GR-)
else()
    target_compile_options(PluginAGPRender PRIVATE -fvisibility=hidden)
endif()
