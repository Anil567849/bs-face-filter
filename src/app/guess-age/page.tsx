'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import * as faceapi from 'face-api.js'

export default function Component() {
  const [age, setAge] = useState<number | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadModels = useCallback(async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.ageGenderNet.loadFromUri('/models')
  }, [])

  useEffect(() => {
    loadModels();
  }, [loadModels])

  const detectFaces = useCallback(async () => {
    if (!fileInputRef || !fileInputRef.current) return;
  
    // Get the input element
    const inputElement = fileInputRef.current;
  
    // Check if a file is selected
    if (inputElement.files && inputElement.files[0]) {
      const file = inputElement.files[0];
      
      // Create an image element to load the selected file
      const img = new Image();
      const reader = new FileReader();

        // Load the image file
        reader.onload = () => {
          img.src = reader.result as string;
          try {
            // When the image is loaded
            img.onload = () => {
              setTimeout(async () => {
                const detections = await faceapi.detectSingleFace(img).withAgeAndGender()
                if(!detections) return;
                // console.log(detections);                
                setAge(parseFloat(detections.age.toFixed(2)));
                setGender(detections.gender);
              }, 2000);

            }
          } catch (error) {
            console.log('Error is:', { error });
          }
        }

      
      // Read the file as a data URL
      reader.readAsDataURL(file);
    } else {
      alert("No image selected");
    }
  }, []);

  useEffect(() => {
    // Cleanup function to revoke the object URL when component unmounts or when imagePreview changes
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAge(null);
    setGender(null);
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // Revoke the previous object URL to avoid memory leaks
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      // Create a new object URL for the selected image
      setImagePreview(URL.createObjectURL(file))
      detectFaces();
    } else {
      setFileName(null)
      setImagePreview(null)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Choose an Image & Get Age</h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  aria-label="Choose image file"
                />
                <button
                  onClick={handleButtonClick}
                  className="w-full px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  <div className="flex items-center justify-center">
                    <Upload className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">Select Image</span>
                  </div>
                </button>
                {fileName && (
                  <div className="mt-2 p-2 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600 truncate">Selected: {fileName}</p>
                  </div>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all duration-300 ease-in-out hover:border-purple-500">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected preview"
                    className="w-full h-48 object-contain rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <ImageIcon className="w-16 h-16 mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between px-8 py-4 bg-gray-50 border-t border-gray-200">
            { gender && <p className="text-2xl text-black font-bold">Gender: {gender}</p>}
            { age && <p className="text-2xl text-black font-bold">Age: {age}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}