import os
from PIL import Image, ImageEnhance, ImageOps

def transform_images(input_dir, output_dir, target_width=320):
    """
    Transforms images in input_dir to a Nokia-style pixel art aesthetic and saves them to output_dir.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Supported extensions
    extensions = ('.png', '.jpg', '.jpeg', '.bmp')

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(extensions):
            file_path = os.path.join(input_dir, filename)
            try:
                with Image.open(file_path) as img:
                    # Convert to RGB if necessary (e.g. for PNGs with transparency)
                    # We paste onto white background to handle transparency cleanly for 1-bit
                    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                        bg = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode != 'RGBA':
                            img = img.convert('RGBA')
                        bg.paste(img, mask=img.split()[3])
                        img = bg
                    else:
                        img = img.convert('RGB')

                    # 1. Resize to tiny resolution to force pixelation
                    # "Boxy/Cute" look requires very small source resolution (e.g. 64-80px width)
                    # User requested more detail: bumping to 150
                    TINY_WIDTH = 150
                    aspect = img.height / img.width
                    tiny_height = int(TINY_WIDTH * aspect)
                    img_tiny = img.resize((TINY_WIDTH, tiny_height), Image.Resampling.LANCZOS)

                    # 2. Enhance Contrast on tiny image
                    enhancer = ImageEnhance.Contrast(img_tiny)
                    img_contrast = enhancer.enhance(1.5)

                    # 3. Convert to 1-bit monochrome (Thresholding/Dither)
                    # Using clean threshold (no dither) for "boxy" look
                    img_pixelated = img_contrast.convert('1', dither=Image.Dither.NONE)

                    # 4. Upscale back to target size using NEAREST NEIGHBOR
                    # This bakes the sharp pixels into the image file
                    new_height = int(target_width * aspect)
                    img_output = img_pixelated.resize((target_width, new_height), Image.Resampling.NEAREST)

                    # Save
                    base_name = os.path.splitext(filename)[0]
                    # Saving as PNG to preserve the sharp pixel edges
                    output_path = os.path.join(output_dir, f"{base_name}.png")
                    img_output.save(output_path)
                    
                    print(f"Processed: {filename} -> {output_path}")

            except Exception as e:
                print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
    OUTPUT_DIR = os.path.join(ASSETS_DIR, 'pixelated')

    print(f"Scanning {ASSETS_DIR}...")
    transform_images(ASSETS_DIR, OUTPUT_DIR)
    print("Done!")
