import {get_files} from "@/services/files.js"
import {useUploadManager} from "@/hooks/useUploadManager.js"
import {account_session} from "@/services/account.js"
import {useQuery, useQueryClient} from "@tanstack/react-query"

export function useManager() {
    const { data: { user, session }, refetch: refreshSession } = useQuery({ initialData: { session: null, user: null }, queryKey: ["user"], queryFn: async () => {
        const data = { session: false, user: null }
        const response = await account_session()
        if (response.success) {
            data.session = response.session
            data.user = response.user
        }
        return data
    }, staleTime: 60*1000 })

    const { data: files } = useQuery({ initialData: null, queryKey: ["files"], queryFn: async () => {
        const response = await get_files()
        if (response.success === true) {
            return response.files
        } else {
            return null
        }
    }})

    const queryClient = useQueryClient()

    function addLocalFile(file) {
        queryClient.setQueryData(["files"], old => (old ? [...old, file] : [file]))
    }

    function removeLocalFile(id) {
        queryClient.setQueryData(["files"], old => (old ?? []).filter(file => file.id !== id))
    }

    const uploadManager = useUploadManager({ addLocalFile, refreshSession })

    return { user, session, files, addLocalFile, removeLocalFile, uploadManager, refreshSession }
}