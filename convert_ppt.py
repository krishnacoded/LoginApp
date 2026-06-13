import sys
import os
import comtypes.client

def convert_pptx_to_pdf(input_file_path, output_file_path):
    input_file_path = os.path.abspath(input_file_path)
    output_file_path = os.path.abspath(output_file_path)

    print(f"Starting conversion of {input_file_path} to {output_file_path}...")
    
    # Initialize PowerPoint application object
    powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
    # Set visible to True/False as needed (some comtypes require visible to open files)
    powerpoint.Visible = 1
    
    try:
        # Open the presentation
        # WithWindow=False hides the window during opening
        deck = powerpoint.Presentations.Open(input_file_path, WithWindow=False)
        # Save as PDF (file format 32 represents PDF in PowerPoint)
        deck.SaveAs(output_file_path, 32)
        deck.Close()
        print(f"✅ Conversion complete! PDF saved to: {output_file_path}")
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        sys.exit(1)
    finally:
        powerpoint.Quit()

if __name__ == "__main__":
    input_ppt = "peopleflow_internship_presentation.pptx"
    output_pdf = "peopleflow_internship_presentation.pdf"
    
    if not os.path.exists(input_ppt):
        print(f"Error: {input_ppt} not found in current directory.")
        sys.exit(1)
        
    convert_pptx_to_pdf(input_ppt, output_pdf)
